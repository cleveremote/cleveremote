import * as xbee_api from "xbee-api";
import { filter, pluck, catchError, ignoreElements, flatMap, takeUntil, merge, map, mergeMap, reduce, take, tap, retryWhen, repeatWhen, delay, repeat } from "rxjs/operators";
import { empty, timer, Observable, of, forkJoin, Subject, interval, pipe } from "rxjs";
import { XbeeHelper } from "../helpers/xbee.helper";
import { Transceiver } from "../classes/transceiver.class";
import { TRANSCIEVER_TYPE, TRANSCIEVER_STATUS } from "../classes/device.class";
import { IOCfg, TYPE_IOCFG } from "../classes/iocfg.class";
import { Injectable, Inject, forwardRef } from "@nestjs/common";

import { Tools, liveRefresh } from "../../common/tools-service";
import { genericRetryStrategy } from "../../common/generic-retry-strategy";
import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';
import { TransceiverService } from "../../manager/services/transceiver.service";
import { TransceiverDto } from "../../manager/dto/transceiver.dto";
import { ModuleDto } from "../../manager/dto/module.dto";
import { v1 } from 'uuid';
import { TransceiverEntity } from "../../manager/entities/transceiver.entity";
import { TransceiverQueryDto } from "../../manager/dto/transceiver.query.dto";
import { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } from 'deep-object-diff';
import { differenceObject } from "../helpers/deep-compare-objects.helper";
import { ObserveOnMessage } from "rxjs/internal/operators/observeOn";
import { Router } from "express";
import { SleepCfg, TYPE_SLEEPCFG } from "../classes/sleepcfg.class";
import { ModuleEntity } from "../../manager/entities/module.entity";
import { KafkaService } from "../../kafka/services/kafka.service";

@Injectable()
export class XbeeService {
    public progressBar;
    public xbee;

    public xbeeAPI: any;
    public subscription;

    public inProccessList = [];
    public transceivers: Array<Transceiver> = [];
    public transceiversdB: Array<TransceiverEntity> = [];
    public graphData: any;

    public fullData: Array<Transceiver> = [];
    public allTransceivers: Array<TransceiverEntity>;

    constructor(
        @Inject(forwardRef(() => TransceiverService)) private readonly transceiverService: TransceiverService,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService) {
    }
    public getNetworkGraph(): Observable<any> {
        return of(this.graphData);
    }
    public getGraphData(): any {
        const graphData = { nodes: [], links: [] };
        const query = new TransceiverQueryDto();
        query.deviceId = 'server_1';
        this.transceivers.forEach(transceiver => {
            const transceiverEntity = this.transceiversdB.find(entity => entity.id === transceiver.address64);
            const nodeData = { power: transceiver.powerSupply, lastseen: transceiver.lastSeen, ...transceiverEntity };
            graphData.nodes.push({ id: transceiver.address64, name: '', type: transceiverEntity.type, status: transceiverEntity.status, powerSupply: transceiver.powerSupply || -1 });

            transceiverEntity.modules.forEach(module => {
                graphData.nodes.push({ id: module.id, name: module.name, type: 'MODULE', status: 'WIRED' });
                graphData.links.push({ source: transceiverEntity.id, target: module.id, status: 'WIRED', type: 'WIRE' });
            });

            if (transceiver.type === TRANSCIEVER_TYPE.ENDDEVICE) {
                const hasMany = graphData.links.filter((l) => l.target === transceiver.address64);
                if (hasMany.length > 1) {
                    const indexToDelete = graphData.links.findIndex((l) => l.target === transceiver.address64 && l.status === 'INACTIF');
                    graphData.links.splice(indexToDelete, 1);
                }
            }

            if (transceiver.links) {
                transceiver.links.forEach(link => {
                    let merged = false;
                    const l = graphData.links.find((l) => l.source === link.target && l.target === link.source);
                    const target = this.transceivers.find(_ => _.address64 === link.target);
                    const hasMany = graphData.links.filter((l) => l.target === target.address64);
                    if (target.type !== TRANSCIEVER_TYPE.ENDDEVICE || hasMany.length === 0 && link.status !== 'INACTIF') {
                        if (l) {
                            l.bidirectional = true;
                            l.lqibis = link.lqi;
                            merged = true;
                        }
                        if (!merged) {
                            const target = this.transceivers.find(_ => _.address64 === link.target);
                            const hasMany = graphData.links.filter((l) => l.target === target.address64);
                            if (target.type !== TRANSCIEVER_TYPE.ENDDEVICE || hasMany.length === 0) {

                                if ((transceiver.status === TRANSCIEVER_STATUS.ACTIF && target.status === TRANSCIEVER_STATUS.SLEEPY)) {
                                    link.status = TRANSCIEVER_STATUS.SLEEPY;
                                } else if (target.status === TRANSCIEVER_STATUS.INACTIF || transceiver.status === TRANSCIEVER_STATUS.INACTIF) {
                                    link.status = TRANSCIEVER_STATUS.INACTIF;
                                } else if (target.status === TRANSCIEVER_STATUS.ACTIF && transceiver.status === TRANSCIEVER_STATUS.ACTIF) {
                                    link.status = TRANSCIEVER_STATUS.ACTIF;
                                }
                                graphData.links.push(link);
                            }

                        }
                    }
                });
            }
        });
        this.graphData = graphData;
        return this.graphData;
    }

    public notifyChanges(): void {
        if (liveRefresh.active) {
            const previousGraphData = this.clone(this.graphData);
            const currentGraphData = this.getGraphData();
            const differences: any = detailedDiff(previousGraphData, currentGraphData);
            if (Object.keys(differences.deleted).length > 0) {
                console.log('graph deleted => ', differences.deleted);
            }

            if (Object.keys(differences.updated).length > 0) {
                console.log('graph updated => ', differences.updated);
                this.kafkaService.executeSync('aggregator_logsync', currentGraphData, 'UPDATE', 'NETWORK', 'server_1').subscribe(
                    (result) => {
                        const t = 1;
                    },
                    (err) => {
                        liveRefresh.active = false;
                        const t = 2;
                    });
            }

            if (Object.keys(differences.added).length > 0) {
                console.log('graph added => ', differences.added);
            }
        }
    }

    public clone(data): any {
        return data ? JSON.parse(JSON.stringify(data)) : undefined;
    }

    public monitorIODataPackets(): void {
        const observable = this.xbee.allPackets
            .pipe(filter((packet: any) => packet.clusterId === '0092' || packet.type === 0x92))
            .pipe(mergeMap(packet =>
                of(true)
                    .pipe(mergeMap(_ => this.processAddDevices([packet])))
                    .pipe(mergeMap(_ => this.processUpdateDevices([packet])))
                    .pipe(mergeMap(_ => this.processIncommingData(packet)))
                    .pipe(tap(_ => this.notifyChanges()))
                    .pipe(catchError(val => {
                        this.subscription.unsubscribe();
                        this.subscription = undefined;
                        this.monitorIODataPackets();
                        return of(packet);
                    }))

            ));

        this.subscription = observable.subscribe();
    }

    public initTransceiver(deviceType: TRANSCIEVER_TYPE, packet: any): Observable<Transceiver> {
        const transceiver = new Transceiver();
        transceiver.address64 = packet.remote64;
        transceiver.type = deviceType;
        transceiver.status = TRANSCIEVER_STATUS.ACTIF;
        this.transceivers.push(transceiver);

        return this.setConfiguration(transceiver, new SleepCfg(TYPE_SLEEPCFG.INITIAL, 500, 1).getConfig())
            .pipe(mergeMap(result => this.setConfiguration(transceiver, new IOCfg(TYPE_IOCFG.FULL_DIGITAL_INPUT))))
            .pipe(mergeMap(result => this.checkLinks(transceiver)));
    }

    public checkLinks(transceiver: Transceiver): Observable<Transceiver> {
        if (!transceiver.links) {
            transceiver.links = [];
        }
        const previousLinks = JSON.parse(JSON.stringify(transceiver.links));

        return this.getLinksCfg(transceiver)
            .pipe(mergeMap(_transceiver => {
                const differences: any = detailedDiff(previousLinks, transceiver.links);
                if (Object.keys(differences.deleted).length > 0) {
                    // console.log('link deleted => ', differences.deleted);
                }

                if (Object.keys(differences.updated).length > 0) {
                    // console.log('link updated => ', differences.updated);
                }

                if (Object.keys(differences.added).length > 0) {
                    // console.log('link added => ', differences.added);
                }

                return of(transceiver);
            }));
    }

    public getLinksCfg(transceiver: Transceiver): Observable<Transceiver> {
        return this.executeLocalCommand('CH')
            .pipe(mergeMap(() =>
                this.executeLocalCommand('AO', [1])
                    .pipe(mergeMap(() => this.requestLqi(0, transceiver)))
                //.pipe(mergeMap(() => this.requestRtg(0, transceiver)))

            ))
            .pipe(mergeMap(() => this.executeLocalCommand('AO', [0x00])))
            .pipe(mergeMap(() => this.executeLocalCommand('AC')))
            .pipe(map(() => transceiver));
    }

    public setConfiguration(transceiver: Transceiver, configuration: IOCfg | any): Observable<any> {
        let cmdObs: Observable<boolean> = of(true);
        for (const cmd of Object.keys(configuration)) {
            const params = configuration[cmd];
            cmdObs = cmdObs.pipe(mergeMap(() => this.executeRemoteCommand(1000, cmd, transceiver.address64, params).pipe(map(() => true))));
        }
        return cmdObs.pipe(map(response => {
            const result = (response && configuration instanceof IOCfg) ? transceiver.iOCfg = configuration : ((response) ? transceiver.sleepCfg = configuration : undefined);
            return transceiver;
        }));
    }

    public processIncommingData(packet: any): Observable<any> {
        const transceiverFound = this.transceiversdB.find(transceiver => transceiver.id === packet.remote64);
        if (transceiverFound) {
            if (packet.clusterId === '0092') {
                const io = XbeeHelper.frameIOConverter(packet.data);
                // console.log("from " + packet.remote64 + " as rx sample as cluster:", io.digitalSamples);
            } else {
                // console.log("from " + packet.remote64 + " as native sample as cluster:", packet.digitalSamples);
            }
            return of(true);
        }
        return of(false);
    }

    public init(): Observable<boolean> {
        this.progressBar = Tools.startProgress('RF module Xbee configuration   ', 0, 5, '* Start micro-service : RF network ...');
        const exists = portName => SerialPort.list().then(ports => ports.some(port => port.comName === portName));
        const xbeeObs = new Observable<any>(observer => {
            let xbee: any;
            try {
                xbee = xbeeRx({/* serialport: '/dev/ttyUSB0',*/serialport: 'COM7', serialPortOptions: { baudRate: 9600 }, module: "ZigBee" });
            } catch (err) {
                observer.error(err);
            }
            observer.next(xbee);
        });

        // return of(exists('/dev/ttyUSB0')).pipe(map((isOk: any) => { for linux
        return of(exists('COM7')).pipe(mergeMap((isOk: boolean) => {
            if (isOk) {
                return xbeeObs.pipe(
                    map((xbee: any) => {
                        this.xbee = xbee;
                        this.progressBar.increment();
                        return true;
                    }, (err: any) => {
                        Tools.logError(`  => Xbee initilization failed ${err}`);
                        return false;
                    }))
                    .pipe(mergeMap(result => this.initializeNetwork()))
                    .pipe(tap(result => this.monitorIODataPackets()));
            }
            Tools.logWarn(`  => Xbee port not found!`);
            return of(false);
        }))
            .pipe(tap(() => this.progressBar.increment()))
            .pipe(tap(() => Tools.stopProgress('RF module Xbee configuration   ', this.progressBar)))
            .pipe(
                catchError(error => {
                    Tools.stopProgress('RF module Xbee configuration   ', this.progressBar, error);
                    return of(false);
                })
            );
    }

    public initializeNetwork(): Observable<any> {
        return this.convertDBTransceivers()
            .pipe(tap(() => this.progressBar.increment()))
            .pipe(mergeMap(() => this.discoverNetwork()))
            .pipe(tap(() => this.progressBar.increment()))
            .pipe(tap(() => this.intervalNodeDiscovery()))
            .pipe(tap(() => this.progressBar.increment()))
            .pipe(catchError(val => of(false)));
    }

    public convertDBTransceivers(): Observable<any> {
        const query = new TransceiverQueryDto();
        query.deviceId = 'server_1';
        return this.transceiverService.getAll(query).pipe(tap((transceiverEntities: Array<TransceiverEntity>) => {
            this.transceiversdB = transceiverEntities;
            this.transceiversdB.forEach(transceiverdB => {
                const transceiver = new Transceiver();
                transceiver.address64 = transceiverdB.id;
                transceiver.type = TRANSCIEVER_TYPE[transceiverdB.type];
                transceiver.status = TRANSCIEVER_STATUS.INACTIF;
                transceiver.sleepCfg = (transceiverdB.configuration as any).sleepCfg;
                transceiver.iOCfg = (transceiverdB.configuration as any).IOCfg;
                transceiver.links = undefined;
                this.transceivers.push(transceiver);
            });
        }));
    }

    public discoverNetwork(): Observable<any> {
        return this.executeLocalCommand('NJ', [255])
            .pipe(mergeMap(() => this.GetNodeDiscovery()))
            .pipe(mergeMap(nodes =>
                of(true)
                    .pipe(mergeMap(_ => this.processAddDevices(nodes)))
                    .pipe(mergeMap(_ => this.processUpdateDevices(nodes)))
                    .pipe(mergeMap(_ => this.proccessDeleteDevices(nodes)))
                    .pipe(tap(_ => this.notifyChanges()))));

    }

    public processAddDevices(nodes: Array<any>): Observable<boolean | Array<Transceiver>> {
        let obs: Observable<any> = of(true);
        const elementToAdd = [];
        const nodesToAdd = nodes.filter(node => {
            const inProccess = this.inProccessList.find(transceiver => transceiver === node.remote64);
            const found = this.transceiversdB.find(transceiver => transceiver.address === node.remote64);
            return !inProccess && !found;
        });
        nodesToAdd.forEach(node => {
            this.inProccessList.push(node.remote64);
            obs = obs.pipe(mergeMap(() => this.addNewDevice(node, elementToAdd)));
        });

        return obs.pipe(map((success: boolean) => success))
            .pipe(mergeMap(success => success && elementToAdd.length > 0 ? this.saveTransceiversToDB(elementToAdd) : of(true)))
            .pipe(catchError(val => of(false)));
    }

    public processUpdateDevices(nodes: Array<any>): Observable<boolean | Array<Transceiver>> {
        let obs: Observable<any> = of(true);
        const elementToUpdate = [];
        const nodesToUpdate = nodes.filter(node => {
            const inProccess = this.inProccessList.find(transceiver => transceiver === node.remote64);
            const found = this.transceiversdB.find(transceiver => transceiver.address === node.remote64);
            return !inProccess && found;
        });
        nodesToUpdate.forEach(node => {
            this.inProccessList.push(node.remote64);
            const transceiver = this.transceivers.find(_transceiver => _transceiver.address64 === node.remote64);
            transceiver.lastSeen = new Date();
            transceiver.status = TRANSCIEVER_STATUS.ACTIF;
            transceiver.type = node.deviceType ? node.deviceType : transceiver.type;
            if (node.remote16) {
                transceiver.address16 = node.remote16;
            }
            if (transceiver.type !== TRANSCIEVER_TYPE.ENDDEVICE) {
                obs = obs.pipe(mergeMap(() => this.checkLinks(transceiver)));
            } else {
                transceiver.links = [];
            }
            elementToUpdate.push(transceiver);
        });

        return obs.pipe(map((success: boolean) => success))
            .pipe(mergeMap(success => success && elementToUpdate.length > 0 ? this.saveTransceiversToDB(elementToUpdate) : of(true)))
            .pipe(map(success => {
                elementToUpdate.forEach(transceiverToUpdate => {
                    this.removeFromProccessList(String(transceiverToUpdate.address64));
                });
                return true;
            }))
            .pipe(catchError(val => of(false)));
    }

    public proccessDeleteDevices(nodes: Array<any>): Observable<Array<any>> {
        let obs: Observable<any> = of(true);
        const transceiversToUpdate: Array<Transceiver> = [];
        const existingTransceivers = this.transceiversdB.filter(transceiverdB => transceiverdB.status === TRANSCIEVER_STATUS.ACTIF);
        existingTransceivers.forEach(existingTransceiver => {
            const exist = nodes.find(node => node.remote64 === existingTransceiver.address);
            if (!exist) {
                const transceiver = this.transceivers.find(_transceiver => _transceiver.address64 === existingTransceiver.address);
                existingTransceiver.status = TRANSCIEVER_TYPE[existingTransceiver.type] === TRANSCIEVER_TYPE.ENDDEVICE ? TRANSCIEVER_STATUS.SLEEPY : TRANSCIEVER_STATUS.INACTIF;
                transceiver.status = TRANSCIEVER_STATUS[existingTransceiver.status];
                transceiversToUpdate.push(transceiver);
            }
        });
        if (transceiversToUpdate.length > 0) {
            obs = obs.pipe(map(() => this.saveTransceiversToDB(transceiversToUpdate)));
        }

        return obs.pipe(map(success => {
            transceiversToUpdate.forEach(transceiverToUpdate => {
                this.removeFromProccessList(String(transceiverToUpdate.address64));
            });
            return true;
        }))
            .pipe(map(success => success ? nodes : []));
    }

    public addNewDevice(packet: any, elementsToAddObs: Array<Transceiver>): Observable<any> {
        const obs = packet.deviceType ? of(packet.deviceType) : this.getDeviceType(packet.remote64);

        return obs.pipe(mergeMap(deviceType => {
            const transceiverId = packet.remote64;
            if (deviceType === TRANSCIEVER_TYPE.ENDDEVICE) {
                return this.disableSleep(transceiverId)
                    .pipe(mergeMap((disabled: boolean) => this.initTransceiver(TRANSCIEVER_TYPE.ROUTER, packet)
                        .pipe(tap(transceiver => elementsToAddObs.push(transceiver) && this.removeFromProccessList(String(transceiver.address64))))));
            }
            return this.initTransceiver(deviceType, packet)
                .pipe(tap(transceiver => elementsToAddObs.push(transceiver) && this.removeFromProccessList(String(transceiver.address64))));
        }));
    }

    public removeFromProccessList(transceiverId: string): Array<string> {
        const indexToRemove = this.inProccessList.findIndex(x => x === transceiverId);
        return this.inProccessList.splice(indexToRemove, 1);
    }

    public intervalNodeDiscovery(): void {
        of(true)
            .pipe(mergeMap(() => this.discoverNetwork()
                .pipe(map(() => { throw { message: 'repeat' }; }))), retryWhen(genericRetryStrategy({ durationBeforeRetry: 1000, maxRetryAttempts: -1 }))
            ).subscribe();
    }

    public saveTransceiversToDB(transceivers: Array<Transceiver>): Observable<Array<Transceiver> | boolean> {
        const dtos: Array<TransceiverEntity> = [];
        transceivers.forEach(transceiver => {
            const record = this.buildTransceiverRecord(transceiver);
            dtos.push(record);
        });
        return this.transceiverService.update(dtos)
            .pipe(map((entities: Array<TransceiverEntity>) => {
                entities.forEach(entity => {
                    const foundIndex = this.transceiversdB.findIndex(transceiverdB => transceiverdB.address === entity.address);
                    if (foundIndex === -1) {
                        this.transceiversdB.push(entity);
                    } else {
                        this.transceiversdB[foundIndex] = entity;
                    }
                });
                return transceivers;
            }))
            .pipe(catchError(val => of(false)));
    }

    public buildTransceiverRecord(transceiver: Transceiver): TransceiverEntity {
        const transceiverEntity = this.transceiversdB.find(transceiverdB => transceiverdB.id === transceiver.address64);
        let dto: TransceiverEntity;
        if (!transceiverEntity) {
            const transceiverAddress64 = String(transceiver.address64);
            dto = new TransceiverEntity();
            dto.id = transceiverAddress64;
            dto.name = 'R(n)';
            dto.description = 'description Router(n)';
            dto.deviceId = 'server_1';
            dto.address = transceiverAddress64;
            dto.type = transceiver.type === TRANSCIEVER_TYPE.COORDINATOR ? 'COORDINATOR' : (transceiver.type === TRANSCIEVER_TYPE.ROUTER ? 'ROUTER' : 'ENDDEVICE');
            if (transceiver.type === TRANSCIEVER_TYPE.ENDDEVICE) {
                transceiver.links = [];
            }
            dto.configuration = { sleepCfg: transceiver.sleepCfg, IOCfg: transceiver.iOCfg };
            dto.status = !transceiver.status ? 'ACTIF' : transceiver.status;
            dto.modules = [];
            if (transceiver.iOCfg) {
                for (const port of Object.keys(transceiver.iOCfg)) {
                    const module = new ModuleEntity();
                    module.id = v1();
                    module.port = port;
                    module.status = !transceiver.status ? 'ACTIF' : transceiver.status;
                    module.name = `name_${module.id}`;
                    module.transceiverId = transceiverAddress64;
                    dto.modules.push(module);
                }
            }
        } else {
            transceiverEntity.type = transceiver.type === TRANSCIEVER_TYPE.COORDINATOR ? 'COORDINATOR' : (transceiver.type === TRANSCIEVER_TYPE.ROUTER ? 'ROUTER' : 'ENDDEVICE');
            transceiverEntity.configuration = { sleepCfg: transceiver.sleepCfg, IOCfg: transceiver.iOCfg };
            transceiverEntity.status = !transceiver.status ? 'ACTIF' : transceiver.status;
            transceiverEntity.modules.forEach(module => {
                module.status = !transceiver.status ? 'ACTIF' : transceiver.status;
            });
            dto = transceiverEntity;
        }

        return dto;
    }

    public GetNodeDiscovery(): Observable<any> {
        const nodeDiscoveryCommandStream = this.xbee.localCommand({ command: "ND" })
            .pipe(catchError(err => []), ignoreElements());

        const nodeDiscoveryRepliesStream = this.xbee.allPackets
            .pipe(filter((packet: any) => packet.type === xbee_api.constants.FRAME_TYPE.AT_COMMAND_RESPONSE && packet.command === "ND"), pluck("nodeIdentification"));

        return this.xbee.localCommand({ command: "NT" })
            .pipe(flatMap((ntResult: any) => {
                const timeoutMs = ntResult.commandData.readInt16BE(0) * 100;
                return nodeDiscoveryRepliesStream
                    .pipe(takeUntil(timer(timeoutMs + 1000)), merge(nodeDiscoveryCommandStream))
                    .pipe(reduce((a, c) => [...a, c], []));
            }));
    }

    public requestRtg(start: any, transceiver: Transceiver): Observable<Transceiver> {
        if (!transceiver.routings || start === 0) {
            transceiver.routings = [];
        }
        const type = xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX;
        const frame = {
            type: 0x11, // xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST
            destination64: transceiver.address64, // "0013A20040C04982" default is broadcast address
            // destination16: "fffe", // default is "fffe" (unknown/broadcast)
            sourceEndpoint: 0x00,
            destinationEndpoint: 0x00,
            clusterId: "0032",
            profileId: "0000",
            broadcastRadius: 0x00, // optional, 0x00 is default
            options: 0x00, // optional, 0x00 is default
            data: [0x01, start] // Can either be string or byte array.
        };

        return this.xbee.explicitAdressing(frame, type).pipe(mergeMap((resultRtg: any) => {
            const object: any = XbeeHelper.routingTable(resultRtg.data);
            object.routingtablelist = object.routingtablelist.filter(_ => _.routeStatus === 'ACTIVE');
            if (object.routingtablelist.length > 0) {
                object.routingtablelist.forEach(element => {
                    transceiver.routings.push(element);
                });

            }
            if (object.routingtableentries > Number(object.routingtablelistcount) + Number(object.startindex)) {
                return this.requestRtg(XbeeHelper.decimalToHexString(Number(object.routingtablelistcount) + Number(object.startindex)), transceiver);
            }

            return of(transceiver);
        }));
    }

    public requestLqi(start: any, transceiver: Transceiver): Observable<Transceiver> {

        const type = xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX;
        const frame = {
            type: 0x11, destination64: transceiver.address64, destination16: "fffe", sourceEndpoint: 0x00,
            destinationEndpoint: 0x00, clusterId: "0031", profileId: "0000", broadcastRadius: 0x00, options: 0x00, data: [0x01, start]
        };

        return this.xbee.explicitAdressing(frame, type).pipe(mergeMap((resultlqi: any) => {
            try {
                transceiver.links = !transceiver.links ? [] : transceiver.links; // || start === 0

                transceiver.links.forEach(_link => _link.status = 'INACTIF');

                const object = XbeeHelper.lqiTable(resultlqi.data);
                (object.neighborlqilist as any).forEach((neighborlqi: any) => {
                    const indexFound = transceiver.links ? transceiver.links.findIndex(_link => _link.target === neighborlqi.extAddr) : -1;
                    if (indexFound !== -1) {
                        transceiver.links[indexFound] = { source: transceiver.address64, target: neighborlqi.extAddr, lqi: neighborlqi.lqi, type: 'AIR', status: transceiver.status };
                    } else if (transceiver.address64 !== neighborlqi.extAddr && [3, 1, 0].indexOf(neighborlqi.relationship) !== -1) {
                        const link = { source: transceiver.address64, target: neighborlqi.extAddr, lqi: neighborlqi.lqi, type: 'AIR', status: 'ACTIF' };
                        transceiver.links.push(link);
                    }
                });

                if (object.neighbortableentries > Number(object.neighborlqilistcount) + Number(object.startindex)) {
                    return this.requestLqi(XbeeHelper.decimalToHexString(Number(object.neighborlqilistcount) + Number(object.startindex)), transceiver);
                }
            } catch (err) {
                // console.log('result error ', resultlqi, err);
            }

            return of(transceiver);
        }));
    }

    public getDeviceType(transceiverId: string): Observable<TRANSCIEVER_TYPE> {
        return this.executeRemoteCommand(3000, 'SM', transceiverId)
            .pipe(map(response =>
                XbeeHelper.byteArrayToNumber(response.commandData) === 5 ? TRANSCIEVER_TYPE.ENDDEVICE : TRANSCIEVER_TYPE.ROUTER));
    }

    public disableSleep(adrress): Observable<any> {
        return this.executeRemoteCommand(60000, 'SM', adrress, [0], 0x02)
            .pipe(map(() => true));
    }

    public enableSleep(transceiver: Transceiver): Observable<any> {
        return this.executeRemoteCommand(30000, 'SM', transceiver.id, [5], 0)
            .pipe(mergeMap(() => this.executeRemoteCommand(60000, 'WR', transceiver.id, undefined, 0x02).pipe(map(() => true))));
    }

    public executeRemoteCommand(timeout: number, cmd: string, address: string | ArrayBuffer, params?: Array<number> | string, option?: number): Observable<any> {
        const localCommandObj = { command: cmd, destination64: address, timeoutMs: timeout, options: option } as any;
        if (params) { localCommandObj.commandParameter = params; }

        return of(true)
            .pipe(mergeMap(() => this.xbee.remoteCommand(localCommandObj)
                .pipe(map((response: any) => {
                    if (response.commandStatus === 0) {
                        return response;
                    }
                    throw { response };
                }))), retryWhen(genericRetryStrategy({ durationBeforeRetry: 1, maxRetryAttempts: 3 }))
            )
            .pipe(catchError(error => {
                // console.error('fail execute executeRemoteCommand', error);
                return of(undefined);
            }));
    }

    public executeLocalCommand(cmd: string, params?: Array<number> | string): Observable<any> {
        const localCommandObj = { command: cmd } as any;
        if (params) {
            localCommandObj.commandParameter = params;
        }
        return this.xbee.localCommand(localCommandObj).pipe(map((response: any) => response))
            .pipe(catchError(error => {
                // console.error('error', error);
                return of(undefined);
            }));
    }

    // const transceiverFound = this.transceivers.find(transceiver => transceiver.address64 === node.remote64);
    // if (transceiverFound) {
    //     transceiverFound.lastSeen = new Date();
    //     transceiverFound.status = TRANSCIEVER_STATUS.ACTIF;
    // } else {
    //     const transceiver = new Transceiver();
    //     transceiver.address64 = node.remote64;
    //     transceiver.type = node.deviceType === 1 ? TRANSCIEVER_TYPE.ROUTER : TRANSCIEVER_TYPE.ENDDEVICE;
    //     transceiver.status = TRANSCIEVER_STATUS.ACTIF;
    //     this.transceivers.push(transceiver);
    // }

    // public requestRtg(start: any, transceiver: Transceiver): Observable<Transceiver> {
    //     if (!transceiver.routings) {
    //         transceiver.routings = [];
    //     }
    //     const type = xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX;
    //     const frame = {
    //         type: 0x11, // xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST
    //         destination64: transceiver.address64, // "0013A20040C04982" default is broadcast address
    //         destination16: "fffe", // default is "fffe" (unknown/broadcast)
    //         sourceEndpoint: 0x00,
    //         destinationEndpoint: 0x00,
    //         clusterId: "0032",
    //         profileId: "0000",
    //         broadcastRadius: 0x00, // optional, 0x00 is default
    //         options: 0x00, // optional, 0x00 is default
    //         data: [0x01, start] // Can either be string or byte array.
    //     };

    //     return this.xbee.explicitAdressing(frame, type).pipe(mergeMap((resultRtg: any) => {
    //         const object = XbeeHelper.routingTable(resultRtg.data);
    //         transceiver.routings.push(object);
    //         if (object.routingtableentries > Number(object.routingtablelistcount) + Number(object.startindex)) {
    //             return this.requestRtg(XbeeHelper.decimalToHexString(Number(object.routingtablelistcount) + Number(object.startindex)), transceiver);
    //         }

    //         return of(transceiver);
    //     }));
    // }

    // public compareScan(previousTransceivers: Array<Transceiver>): void {
    //     this.transceivers.forEach(currentTransceiver => {
    //         const transceiverFound = previousTransceivers.find(previousTransceiver => previousTransceiver.id === currentTransceiver.id);
    //         if (!transceiverFound) {
    //             currentTransceiver.status = TRANSCIEVER_STATUS.ACTIF;
    //             currentTransceiver.lastSeen = new Date();
    //             this.saveTransceiverToDB(currentTransceiver).subscribe();
    //             const dataFoundIndex = this.fullData.findIndex((data: any) => data.id === currentTransceiver.id);
    //             dataFoundIndex !== -1 ? this.fullData[dataFoundIndex] = currentTransceiver : this.fullData.push(currentTransceiver);
    //         } else {
    //             const differences: any = detailedDiff(transceiverFound, currentTransceiver);
    //             if (differences.deleted && differences.deleted.links && differences.deleted.links['0']) {
    //                 const element = differences.deleted.links['0'];
    //                 for (const prop in element) {
    //                     if (element.hasOwnProperty(prop)) {
    //                         if (prop === 'neighborlqilist') {
    //                             for (const propn in element.neighborlqilist) {
    //                                 if (element.neighborlqilist.hasOwnProperty(propn)) {
    //                                     transceiverFound.links[0].neighborlqilist[Number(propn)].lqi = -1;
    //                                     currentTransceiver.links[0].neighborlqilist.push(transceiverFound.links[0].neighborlqilist[Number(propn)]);
    //                                     const dataFoundIndex = this.fullData.findIndex((data: any) => data.id === transceiverFound.links[0].neighborlqilist[Number(propn)].extAddr);
    //                                     const transceiver = this.fullData[dataFoundIndex];
    //                                     if (transceiver) {
    //                                         if (transceiver.type === TRANSCIEVER_TYPE.ENDDEVICE) {
    //                                             // calculte lastsenn to determine if inactif
    //                                             transceiver.status = TRANSCIEVER_STATUS.SLEEPY;
    //                                         } else {
    //                                             transceiver.status = TRANSCIEVER_STATUS.INACTIF;
    //                                         }
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 }
    //             }

    //             currentTransceiver.status = TRANSCIEVER_STATUS.ACTIF;
    //             currentTransceiver.lastSeen = new Date();
    //             const dataFoundIndex = this.fullData.findIndex((data: any) => data.id === currentTransceiver.id);
    //             dataFoundIndex !== -1 ? this.fullData[dataFoundIndex] = currentTransceiver : this.fullData.push(currentTransceiver);
    //         }

    //     });

    //     previousTransceivers.forEach(previousTransceiver => {
    //         const transceiverFound = this.transceivers.find(currentTransceiver => currentTransceiver.id === previousTransceiver.id);
    //         if (!transceiverFound) {
    //             if (previousTransceiver.type === TRANSCIEVER_TYPE.ROUTER) {
    //                 previousTransceiver.status = TRANSCIEVER_STATUS.INACTIF;
    //             } else if (previousTransceiver.type === TRANSCIEVER_TYPE.ENDDEVICE) {
    //                 previousTransceiver.status = TRANSCIEVER_STATUS.SLEEPY;
    //             }
    //             this.saveTransceiverToDB(previousTransceiver).subscribe();
    //             const dataFoundIndex = this.fullData.findIndex(data => data.id === previousTransceiver.id);
    //             dataFoundIndex !== -1 ? this.fullData[dataFoundIndex] = previousTransceiver : this.fullData.push(previousTransceiver);
    //         }
    //     });
    // }

    // public scanInterval(): void {
    //     of(true)
    //         .pipe(mergeMap(() => this.scanNetwork()
    //             .pipe(map(() => {
    //                 throw { message: 'repeat' };
    //             }))
    //         ),
    //             catchError((e: any) => {
    //                 throw { e };
    //             }),
    //             retryWhen(genericRetryStrategy({ durationBeforeRetry: 5000, maxRetryAttempts: -1 }))
    //         ).subscribe();
    // }

    // public initTransceivers(): Observable<any> {
    //     return this.requestXbeeNodes()
    //         .pipe(mergeMap(() =>
    //             this.scanAll()))
    //         .pipe(mergeMap(() => {
    //             this.progressBar.increment();
    //             return of(this.transceivers);
    //         }));
    // }
    // todo filter function to skip routing inactive

    // public requestXbeeNodes(): Observable<boolean> {

    //     const coordinatorInformationObs = this.executeLocalCommand('NJ', [255])
    //         .pipe(mergeMap((sh: any) =>
    //             this.executeLocalCommand('SH')
    //                 .pipe(mergeMap((sh: any) =>
    //                     this.executeLocalCommand('SL')
    //                         .pipe(mergeMap((sl: any) =>
    //                             this.executeLocalCommand('MY')
    //                                 .pipe(map((my: any) => {
    //                                     const coordinator = this.buildCoordinatorTransceiver(my, sh, sl);
    //                                     return this.setTransceiver(coordinator);
    //                                 }))
    //                         ))
    //                 ))
    //         ));
    //     return coordinatorInformationObs
    //         .pipe(mergeMap(() =>
    //             this.GetNodeDiscovery().pipe(mergeMap((nodes: any) => {
    //                 nodes.forEach(node => this.setTransceiver(node));
    //                 return of(true);
    //             }))
    //         ));
    // }

    // public setTransceiver(data: any): Transceiver {
    //     let transceiver = this.transceivers.find((trans: Transceiver) => trans.id === (data.remote64 || data.sender64));
    //     if (transceiver) {
    //         return transceiver;
    //     }
    //     transceiver = new Transceiver(data);
    //     this.transceivers.push(transceiver);
    //     // save database
    //     return transceiver;
    // }

    // public startListenJoinTransceiver(): Observable<boolean> {
    //     return this.xbee.allPackets.pipe(filter((packet: any) => packet.type === 0x95))
    //         .pipe(mergeMap((packet: any) => {
    //             const transceiver = this.setTransceiver(packet);
    //             return this.scanUnitaire(transceiver);
    //         }));
    // }

    // public getSleepAttributes(transceiver: Transceiver): Observable<any> {
    //     if (transceiver.type === TRANSCIEVER_TYPE.COORDINATOR) {
    //         return this.executeLocalCommand('SP')
    //             .pipe(mergeMap((sp: any) =>
    //                 this.executeLocalCommand('SN')
    //                     .pipe(map((sn: any) =>
    //                         (transceiver).setsleepCfg({ SP: sp, ST: undefined, SM: undefined, SN: sn })
    //                     ))
    //             ));
    //     }

    //     return this.executeRemoteCommand(1000, 'SP', transceiver.id)
    //         .pipe(mergeMap((sp: any) =>
    //             this.executeRemoteCommand(1000, 'ST', transceiver.id)
    //                 .pipe(mergeMap((st: any) =>
    //                     this.executeRemoteCommand(1000, 'SM', transceiver.id)
    //                         .pipe(mergeMap((sm: any) =>
    //                             this.executeRemoteCommand(1000, 'SN', transceiver.id)
    //                                 .pipe(map((sn: any) =>
    //                                     transceiver.setsleepCfg({ SP: sp, ST: st, SM: sm, SN: sn })
    //                                 ))
    //                         ))
    //                 ))
    //         ));

    // }

    // public scanAll(): Observable<Array<Transceiver>> {
    //     return this.coordinatorInitScan(this.transceivers.filter(transceiver => transceiver.type === 0)[0])
    //         .pipe(mergeMap(() => this.scan()))
    //         .pipe(mergeMap(() => this.executeLocalCommand('AO', [0x00])))
    //         .pipe(mergeMap(() => this.executeLocalCommand('AC')));
    // }

    // public scanNetwork(): Observable<Array<Transceiver>> {
    //     console.log('start periodic scan');
    //     const previousScan = JSON.parse(JSON.stringify(this.transceivers));
    //     this.transceivers.filter(transceiver => transceiver.type === 0)[0].links = undefined;
    //     this.transceivers.filter(transceiver => transceiver.type === 0)[0].routings = undefined;
    //     return this.coordinatorInitScan(this.transceivers.filter(transceiver => transceiver.type === 0)[0])
    //         .pipe(mergeMap(() => {
    //             this.transceivers = [this.transceivers.filter(transceiver => transceiver.type === 0)[0]];
    //             return this.scan();
    //         }))
    //         .pipe(mergeMap(() => this.executeLocalCommand('AO', [0x00])))
    //         .pipe(mergeMap(() => this.executeLocalCommand('AC')))
    //         .pipe(map(() => {
    //             this.compareScan(previousScan);
    //             return this.transceivers;
    //         }));
    // }

    // public scan(): Observable<any> {
    //     return this.GetNodeDiscovery().pipe(
    //         mergeMap((nodes: Array<any>) => {
    //             const obsLst: Array<Observable<any>> = [];
    //             nodes.forEach(node => {
    //                 const transceiver = this.setTransceiver(node);
    //                 if (node.deviceType === TRANSCIEVER_TYPE.ROUTER) {
    //                     obsLst.push(this.scanUnitaire(transceiver));
    //                 } else {
    //                     obsLst.push(this.getSleepAttributes(transceiver)
    //                         .pipe(mergeMap(() => this.getConfig(transceiver)
    //                             .pipe(mergeMap(iocfg => this.saveTransceiverToDB(transceiver)))
    //                         )));
    //                 }
    //             });
    //             return obsLst.length > 0 ? forkJoin(obsLst).pipe(mergeMap(() => of(true))) : of([]);
    //         }));
    // }

    // TODO AFTER finish scan set AO to 0
    // public coordinatorInitScan(coordinator: Transceiver): Observable<any> {
    //     return this.executeLocalCommand('OP')
    //         .pipe(mergeMap(() =>
    //             this.executeLocalCommand('CH')
    //                 .pipe(mergeMap(() =>
    //                     this.executeLocalCommand('AO', [1])
    //                         .pipe(mergeMap(() => this.scanUnitaire(coordinator)
    //                         ))
    //                 ))
    //         ));
    // }

    // public buildCoordinatorTransceiver(MY: any, SH: any, SL: any): any {
    //     return { id: "", remote64: XbeeHelper.toHexString(XbeeHelper.concatBuffer(SH.commandData, SL.commandData)), remote16: XbeeHelper.toHexString(MY.commandData), deviceType: 0, nodeIdentifier: undefined, remoteParent16: undefined, digiProfileID: undefined, digiManufacturerID: undefined };
    // }

    // public scanUnitaire(transceiver: Transceiver): Observable<Transceiver> {
    //     // return this.requestRtg(0, transceiver)
    //     //     .pipe(mergeMap(() =>
    //     return this.requestLqi(0, transceiver)
    //         .pipe(mergeMap(() => this.getSleepAttributes(transceiver)
    //             .pipe(mergeMap(() => this.getConfig(transceiver)
    //                 .pipe(mergeMap(iocfg => this.saveTransceiverToDB(transceiver)))
    //             ))
    //         ))
    //         .pipe(mergeMap(() => of(transceiver)));
    //     // ));
    // }

    // public requestRtg(start: any, transceiver: Transceiver): Observable<Transceiver> {
    //     const trans = transceiver.infos;
    //     if (!transceiver.routings) {
    //         transceiver.routings = [];
    //     }
    //     const type = xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX;
    //     const frame = {
    //         type: 0x11, // xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST
    //         destination64: trans.address64, // "0013A20040C04982" default is broadcast address
    //         destination16: "fffe", // default is "fffe" (unknown/broadcast)
    //         sourceEndpoint: 0x00,
    //         destinationEndpoint: 0x00,
    //         clusterId: "0032",
    //         profileId: "0000",
    //         broadcastRadius: 0x00, // optional, 0x00 is default
    //         options: 0x00, // optional, 0x00 is default
    //         data: [0x01, start] // Can either be string or byte array.
    //     };

    //     return this.xbee.explicitAdressing(frame, type).pipe(mergeMap((resultRtg: any) => {
    //         const object = XbeeHelper.routingTable(resultRtg.data);
    //         transceiver.routings.push(object);
    //         if (object.routingtableentries > Number(object.routingtablelistcount) + Number(object.startindex)) {
    //             return this.requestRtg(XbeeHelper.decimalToHexString(Number(object.routingtablelistcount) + Number(object.startindex)), transceiver);
    //         }

    //         return of(transceiver);
    //     }));
    // }

    // public applyFullAnalog(transceiver: Transceiver): Observable<boolean> {
    //     const config = new IOCfg(TYPE_IOCFG.FULL_ANALOG_INPUT);
    //     return this.applyIOConfiguration(transceiver, config);
    // }

    // public applyInitialIOCfg(transceiver: Transceiver): Observable<boolean> {
    //     const config = new IOCfg(TYPE_IOCFG.FULL_DIGITAL_INPUT);
    //     return this.applyIOConfiguration(transceiver, new IOCfg(TYPE_IOCFG.FULL_DIGITAL_INPUT));
    // }

    // public applyInitialSleepCfg(transceiver: Transceiver): Observable<boolean> {
    //     // const config = new IOCfg(TYPE_IOCFG.FULL_DIGITAL_INPUT);
    //     // return this.applyConfiguration(transceiver, new IOCfg(TYPE_IOCFG.FULL_DIGITAL_INPUT));
    //     return of(true);
    // }

    // public applyIOConfiguration(transceiver: Transceiver, configuration: IOCfg): Observable<any> {
    //     const isSleepy: boolean = transceiver.type === TRANSCIEVER_TYPE.ENDDEVICE && transceiver.sleepCfg.SM === 5;

    //     if (!isSleepy) {
    //         return this.setConfiguration(transceiver.id, configuration)
    //             .pipe(mergeMap((result: boolean) => {
    //                 if (result) {
    //                     return this.executeRemoteCommand(60000, 'WR', transceiver.id, undefined, 0x02).pipe(map(() => true));
    //                 }
    //                 return of(false);
    //             }));
    //     }

    //     return this.disableSleep(transceiver.id)
    //         .pipe(mergeMap(() =>
    //             this.setConfiguration(transceiver.id, configuration)
    //                 .pipe(mergeMap(() => this.enableSleep(transceiver)))
    //                 .pipe(mergeMap((result: boolean) => {
    //                     if (result) {
    //                         return this.executeRemoteCommand(60000, 'WR', transceiver.id, undefined, 0x02).pipe(map(() => true));
    //                     }
    //                     return of(false);
    //                 }))
    //         ));
    // }

    // public enableSleep1(adrress): Observable<boolean> {
    //     const nodeDiscoveryRepliesStream: Observable<boolean> = this.xbee.allPackets
    //         .pipe(filter((packet: any) => packet.type === xbee_api.constants.FRAME_TYPE.ZIGBEE_EXPLICIT_RX))
    //         .pipe(take(1))
    //         .pipe(map(() => true));

    //     return this.executeRemoteCommand(1000, 'SM', adrress, [5], 0)
    //         .pipe(mergeMap(() => nodeDiscoveryRepliesStream));
    // }

    // public getConfig(transceiver: Transceiver): Observable<any> {
    //     let cmdObs: Observable<boolean> = of(true);
    //     if (!transceiver.iOCfg) {
    //         transceiver.iOCfg = new IOCfg(TYPE_IOCFG.INIT);
    //     }
    //     if (transceiver.type === TRANSCIEVER_TYPE.COORDINATOR) {
    //         for (const cmd of Object.keys(transceiver.iOCfg)) {
    //             // const params =  transceiver.iOCfg[cmd];
    //             cmdObs = cmdObs.pipe(mergeMap(() => this.executeLocalCommand(cmd)
    //                 .pipe(map((response: any) => {
    //                     transceiver.iOCfg[cmd] = [XbeeHelper.byteArrayToNumber(response.commandData)];
    //                     return true;
    //                 }))
    //             ));
    //         }
    //     } else {
    //         for (const cmd of Object.keys(transceiver.iOCfg)) {
    //             // const params =  transceiver.iOCfg[cmd];
    //             cmdObs = cmdObs.pipe(mergeMap(() => this.executeRemoteCommand(6000, cmd, transceiver.id)
    //                 .pipe(map((response: any) => {
    //                     transceiver.iOCfg[cmd] = [XbeeHelper.byteArrayToNumber(response.commandData)];
    //                     return true;
    //                 }))
    //             ));
    //         }
    //         cmdObs = cmdObs.pipe(mergeMap(() => this.executeRemoteCommand(6000, '%V', transceiver.id)
    //             .pipe(map((response: any) => {
    //                 transceiver.powerSupply = XbeeHelper.byteArrayToNumber(response.commandData);
    //                 return true;
    //             }))
    //         ));
    //     }
    //     return cmdObs;
    // }

    // public setMaxSleepCycle(): Observable<any> {
    //     let cmdObs: Observable<boolean> = of(true);
    //     const coordinator = this.transceivers.filter(transceiver => transceiver.type === 0)[0];
    //     const routers = this.transceivers.filter(transceiver => transceiver.type === 1);
    //     const endDevices = this.transceivers.filter(transceiver => transceiver.type === 2);
    //     // the max SP of endDevice all routers an coordinator must have greater value
    //     const maxSPValue = Math.max.apply(Math, endDevices.map((endDevice: Transceiver) => XbeeHelper.byteArrayToNumber(endDevice.sleepCfg.SP)));

    //     if (XbeeHelper.byteArrayToNumber(coordinator.sleepCfg.SP) < maxSPValue) {
    //         cmdObs = cmdObs.pipe(mergeMap(() => this.executeRemoteCommand(60000, 'SP', coordinator.id, XbeeHelper.numberToBytes(maxSPValue)).pipe(map(() => true))));
    //     }

    //     routers.forEach(router => {
    //         if (XbeeHelper.byteArrayToNumber(router.sleepCfg.SP) < maxSPValue) {
    //             // update SP of router
    //             cmdObs = cmdObs.pipe(mergeMap(() => this.executeRemoteCommand(60000, 'SP', router.id, XbeeHelper.numberToBytes(maxSPValue)).pipe(map(() => true))));
    //         }
    //     });

    //     return cmdObs
    //         .pipe(mergeMap(() => {
    //             let writeCmdObs: Observable<boolean> = of(true);
    //             writeCmdObs = writeCmdObs.pipe(mergeMap(() => this.executeLocalCommand('WR').pipe(map(() => true))));

    //             routers.forEach(router => {
    //                 writeCmdObs = writeCmdObs.pipe(mergeMap(() => this.executeRemoteCommand(60000, 'WR', router.id, undefined, 0x02).pipe(map(() => true))));
    //             });

    //             return writeCmdObs;
    //         }))
    //         .pipe(mergeMap(() =>
    //             of(true)));
    // }

    // public loadDBTransceivers1(): Observable<any> {
    //     const query = new TransceiverQueryDto();
    //     query.deviceId = 'server_1';
    //     return this.transceiverService.getAll(query).pipe(tap((transceiverEntities: Array<TransceiverEntity>) => {
    //         this.allTransceivers = transceiverEntities;
    //     }));
    // }

    // public getSleepCfg(transceiverId: string): Observable<Transceiver> {
    //     const obs = [];
    //     obs.push(this.executeRemoteCommand(3000, 'SM', transceiverId));
    //     obs.push(this.executeRemoteCommand(3000, 'SN', transceiverId));
    //     obs.push(this.executeRemoteCommand(3000, 'SP', transceiverId));
    //     obs.push(this.executeRemoteCommand(3000, 'ST', transceiverId));

    //     return forkJoin(obs).pipe(mergeMap((responses: Array<any>) => {
    //         const node = { id: transceiverId, remote64: transceiverId, deviceType: responses[0] === 0 ? TRANSCIEVER_TYPE.ROUTER : TRANSCIEVER_TYPE.ENDDEVICE };
    //         const transceiver = this.setTransceiver(node);
    //         transceiver.setsleepCfg({ SM: responses[0], SN: responses[1], SP: responses[2], ST: responses[3] });
    //         return of(transceiver);
    //     }));
    // }

    // public getIOCfg(transceiver: Transceiver): Observable<any> {
    //     if (!transceiver.iOCfg) {
    //         transceiver.iOCfg = new IOCfg(TYPE_IOCFG.INIT);
    //     }
    //     const obs: Array<Observable<any>> = [];
    //     for (const cmd of Object.keys(transceiver.iOCfg)) {
    //         obs.push(this.executeRemoteCommand(3000, cmd, transceiver.id).pipe(tap(response => transceiver.iOCfg[cmd] = [XbeeHelper.byteArrayToNumber(response.commandData)])));
    //     }
    //     obs.push(this.executeRemoteCommand(3000, '%V', transceiver.id).pipe(tap(response => transceiver.powerSupply = XbeeHelper.byteArrayToNumber(response.commandData))));

    //     return forkJoin(obs).pipe(mergeMap((responses: Array<any>) => of(transceiver)));
    // }

    // public getIOCfg1(transceiver: Transceiver): Observable<any> {
    //     if (!transceiver.iOCfg) {
    //         transceiver.iOCfg = new IOCfg(TYPE_IOCFG.INIT);
    //     }
    //     const obs: Array<Observable<any>> = [];
    //     for (const cmd of Object.keys(transceiver.iOCfg)) {
    //         obs.push(this.executeRemoteCommand(3000, cmd, transceiver.id).pipe(tap(response => transceiver.iOCfg[cmd] = [XbeeHelper.byteArrayToNumber(response.commandData)])));
    //     }
    //     obs.push(this.executeRemoteCommand(3000, '%V', transceiver.id).pipe(tap(response => transceiver.powerSupply = XbeeHelper.byteArrayToNumber(response.commandData))));

    //     return forkJoin(obs).pipe(mergeMap((responses: Array<any>) => of(transceiver)));
    // }

}
