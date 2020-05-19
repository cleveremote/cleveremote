import * as xbee_api from "xbee-api";
import { filter, pluck, catchError, ignoreElements, flatMap, takeUntil, merge, map, mergeMap, reduce, take, tap, retryWhen, repeatWhen, delay, repeat } from "rxjs/operators";
import { empty, timer, Observable, of, forkJoin, Subject, interval, pipe } from "rxjs";
import { XbeeHelper } from "../helpers/xbee.helper";
import { Transceiver } from "../classes/transceiver.class";
import { TRANSCIEVER_TYPE, TRANSCIEVER_STATUS } from "../classes/device.class";
import { IOCfg, TYPE_IOCFG } from "../classes/iocfg.class";
import { Injectable, Inject, forwardRef } from "@nestjs/common";

import { Tools, boxInfo } from "../../common/tools-service";
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
import { SynchronizerService } from "../../synchronizer/services/synchronizer.service";
import { SYNC_TYPE, SYNC_ACTION, SEND_TYPE } from "../../synchronizer/interfaces/entities.interface";

@Injectable()
export class XbeeService {
    public progressBar;
    public xbee;

    public xbeeAPI: any;
    public subscription;

    public inProccessList = [];
    public transceivers: Array<Transceiver> = [];
    public graphData: any;

    public fullData: Array<Transceiver> = [];
    public allTransceivers: Array<TransceiverEntity>;

    public activeAO = false;

    constructor(
        @Inject(forwardRef(() => TransceiverService)) private readonly transceiverService: TransceiverService,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @Inject(forwardRef(() => SynchronizerService)) private readonly synchronizerService: SynchronizerService) {
    }
    public getNetworkGraph(): Observable<any> {
        return of(this.graphData);
    }
    public getGraphData(): any {
        const graphData = { nodes: [], links: [] };
        const query = new TransceiverQueryDto();
        query.deviceId = 'server_1';
        this.transceivers = this.transceivers.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
        this.transceivers.forEach(transceiver => {
            if (transceiver.links) {
                transceiver.links = transceiver.links.sort((a, b) => (a.source > b.source) ? 1 : ((b.source > a.source) ? -1 : 0));
            }

            this.transceiverService.transceivers = this.transceiverService.transceivers.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
            graphData.links = graphData.links.sort((a, b) => (a.source > b.source) ? 1 : ((b.source > a.source) ? -1 : 0));

            const transceiverEntity = this.transceiverService.transceivers.find(entity => entity.id === transceiver.address64);
            const nodeData = { power: transceiver.powerSupply, lastseen: transceiver.lastSeen, ...transceiverEntity };
            graphData.nodes.push({ id: transceiver.address64, status: transceiver.status, powerSupply: transceiver.powerSupply || -1 });

            // transceiverEntity.modules.forEach(module => {
            //     graphData.nodes.push({ id: module.id, name: module.name, type: 'MODULE', status: 'WIRED' });
            //     graphData.links.push({ source: transceiverEntity.id, target: module.id, status: 'WIRED', type: 'WIRE' });
            // });

            if (transceiver.type === TRANSCIEVER_TYPE.ENDDEVICE) {
                const hasMany = graphData.links.filter(l => l.target === transceiver.address64);
                if (hasMany.length > 1) {
                    const indexToDelete = graphData.links.findIndex(l => l.target === transceiver.address64 && l.status === 'INACTIF');
                    graphData.links.splice(indexToDelete, 1);
                }
            }

            if (transceiver.links) {
                transceiver.links.forEach(link => {
                    let merged = false;
                    const l = graphData.links.find(l => l.source === link.target && l.target === link.source);
                    const target = this.transceivers.find(_ => _.address64 === link.target);
                    if (target) {
                        const hasMany = graphData.links.filter(l => l.target === target.address64);
                        if (target.type !== TRANSCIEVER_TYPE.ENDDEVICE || hasMany.length === 0 && link.status !== 'INACTIF') {
                            if (l) {
                                l.bidirectional = true;
                                l.lqibis = link.lqi;
                                merged = true;
                            }
                            if (!merged) {
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
                    }

                });
            }
        });
        this.graphData = graphData;
        return this.graphData;
    }

    public notifyChanges(): void {
        if (boxInfo.liveReload) {
            const previousGraphData = this.clone(this.graphData);
            const currentGraphData = this.getGraphData();
            previousGraphData.nodes = previousGraphData.nodes.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
            previousGraphData.links = previousGraphData.links.sort((a, b) => (a.source > b.source) ? 1 : ((b.source > a.source) ? -1 : 0));
            currentGraphData.nodes = currentGraphData.nodes.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
            currentGraphData.links = currentGraphData.links.sort((a, b) => (a.source > b.source) ? 1 : ((b.source > a.source) ? -1 : 0));
            const differences: any = detailedDiff(previousGraphData, currentGraphData);
            if (Object.keys(differences.deleted).length > 0) {
                console.log('graph deleted => ', differences.deleted);
            }

            if (Object.keys(differences.updated).length > 0) {
                console.log('graph updated => ', differences.updated);
                this.synchronizerService.remote('aggregator_server', currentGraphData, SYNC_TYPE.LOG, SYNC_ACTION.NOTIFY, 'Network', SEND_TYPE.SEND);
            }

            if (Object.keys(differences.added).length > 0) {
                this.synchronizerService.remote('aggregator_server', currentGraphData, SYNC_TYPE.LOG, SYNC_ACTION.NOTIFY, 'Network', SEND_TYPE.SEND);
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
                    // .pipe(mergeMap(_ => this.processUpdateCfg([packet])))
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
        // if (deviceType === TRANSCIEVER_TYPE.COORDINATOR) {
        //     return of(transceiver);
        // }
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
                this.executeLocalCommand('AO', [1]).pipe(tap(result => this.activeAO = true))
                    .pipe(mergeMap(() => this.requestLqi(0, transceiver)))
                // .pipe(mergeMap(() => this.requestRtg(0, transceiver)))

            ))
            .pipe(mergeMap(() => this.executeLocalCommand('AO', [0x00]))).pipe(tap(result => this.activeAO = false))
            //.pipe(mergeMap(() => this.executeLocalCommand('AC')))
            .pipe(map(() => transceiver));

    }

    public setConfiguration(transceiver: Transceiver, configuration: IOCfg | SleepCfg): Observable<any> {
        let cmdObs: Observable<boolean> = of(true);

        if (transceiver.type === TRANSCIEVER_TYPE.COORDINATOR) {
            for (const cmd of Object.keys(configuration)) {
                if (cmd !== 'SM' && cmd !== 'ST') {
                    const params = configuration[cmd];
                    cmdObs = cmdObs.pipe(mergeMap(() => this.executeLocalCommand(cmd, params).pipe(map(() => true))));
                }
            }
            return cmdObs.pipe(map(response => {
                const result = (response && configuration instanceof IOCfg) ? transceiver.iOCfg = configuration : ((response) ? transceiver.sleepCfg = configuration as SleepCfg : undefined);
                return transceiver;
            }));
        }

        for (const cmd of Object.keys(configuration)) {
            const params = configuration[cmd];
            cmdObs = cmdObs.pipe(mergeMap(() => this.executeRemoteCommand(60000, cmd, transceiver.address64, params).pipe(map(() => true))));
        }
        return cmdObs.pipe(map(response => {
            const result = (response && configuration instanceof IOCfg) ? transceiver.iOCfg = configuration : ((response) ? transceiver.sleepCfg = configuration as SleepCfg : undefined);
            return transceiver;
        }));
    }

    public processIncommingData(packet: any): Observable<any> {
        const transceiverFound = this.transceiverService.transceivers.find(transceiver => transceiver.id === packet.remote64);
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
            this.transceiverService.transceivers = transceiverEntities.filter(_ => _.status !== TRANSCIEVER_STATUS.PENDING);
            this.transceiverService.transceivers.forEach(transceiverdB => {
                const transceiver = new Transceiver();
                transceiver.address64 = transceiverdB.id;
                transceiver.type = transceiverdB.type;
                transceiver.status = TRANSCIEVER_STATUS.INACTIF;
                transceiver.sleepCfg = SleepCfg.convertToTrFormat((transceiverdB.configuration as any).sleepCfg);
                transceiver.iOCfg = (transceiverdB.configuration as any).IOCfg;
                transceiver.links = undefined;
                if (transceiverdB.pending) {
                    const data = transceiverdB.pending;
                    const pendingTransceiver = new Transceiver();
                    pendingTransceiver.address64 = data.address;
                    pendingTransceiver.type = data.type;
                    pendingTransceiver.sleepCfg = SleepCfg.convertToTrFormat((data.configuration as any).sleepCfg);
                    pendingTransceiver.iOCfg = (data.configuration as any).IOCfg;
                    pendingTransceiver.links = undefined;
                    if (!transceiver.pending) {
                        transceiver.pending = {};
                        transceiver.pending.id = data.id;
                        transceiver.pending.wasRouter = transceiver.type === TRANSCIEVER_TYPE.ROUTER;
                        transceiver.pending.cfg = this.checkNeedApplyConfiguration(pendingTransceiver, transceiver, transceiver.pending.id);
                    } else {
                        // remove old pending and put new one where id === transceiver.pending.id;
                        transceiver.pending.id = data.id;
                        transceiver.pending.wasRouter = transceiver.type === TRANSCIEVER_TYPE.ROUTER;
                        transceiver.pending.cfg = this.checkNeedApplyConfiguration(pendingTransceiver, transceiver, transceiver.pending.id);
                    }
                }
                this.transceivers.push(transceiver);
            });
        }));
    }

    public discoverNetwork(): Observable<any> {
        const hasPending = !!this.transceivers.find(_ => _.pending);
        return hasPending ? of(true) : this.executeLocalCommand('NJ', [255])
            .pipe(mergeMap(() => this.GetNodeDiscovery()))
            .pipe(mergeMap(nodes =>
                of(true)
                    // .pipe(mergeMap(_ => this.processUpdateCfg([nodes])))
                    .pipe(mergeMap(_ => this.processAddDevices(nodes)))
                    .pipe(mergeMap(_ => this.processUpdateDevices(nodes)))
                    .pipe(mergeMap(_ => this.proccessDeleteDevices(nodes)))
                    .pipe(tap(_ => this.notifyChanges()))));

    }

    public processAddDevices(nodes: Array<any>): Observable<boolean | Array<Transceiver>> {
        const hasPending = !!this.transceivers.find(_ => _.pending);
        const toto = 2;
        if (hasPending) {
            return of(true);
        }
        let obs: Observable<any> = of(true);
        const elementToAdd = [];
        const nodesToAdd = nodes.filter(node => {
            const inProccess = this.inProccessList.find(transceiver => transceiver === node.remote64);
            const found = this.transceiverService.transceivers.find(transceiver => transceiver.address === node.remote64);
            return !inProccess && !found;
        });
        nodesToAdd.forEach(node => {
            this.inProccessList.push(node.remote64);
            obs = obs.pipe(mergeMap(() => this.addNewDevice(node, elementToAdd)));
        });

        return obs.pipe(map((success: boolean) => success))
            .pipe(mergeMap(success => success && elementToAdd.length > 0 ? this.transceiverService.saveTransceiversToDB(elementToAdd) : of(true)))
            .pipe(catchError(val => of(false)));
    }

    public processUpdateDevices(nodes: Array<any>): Observable<boolean | Array<Transceiver>> {
        let obs: Observable<any> = of(true);
        const elementToUpdate = [];
        const distinctNodes = Tools.onlyDistinctValue(nodes, 'remote64');
        const nodesToUpdate = distinctNodes.filter(node => {
            const inProccess = this.inProccessList.find(transceiver1 => transceiver1 === node.remote64);
            const found = this.transceiverService.transceivers.find(transceiver => transceiver.address === node.remote64);
            return !inProccess && found;
        });
        const hasPending = !!this.transceivers.find(_ => _.pending);
        nodesToUpdate.sort((x, y) => (!!x.pending === !!y.pending) ? 0 : !!x.pending ? -1 : 1);



        nodesToUpdate.forEach(node => {
            this.inProccessList.push(node.remote64);
            const transceiver = this.transceivers.find(_transceiver => _transceiver.address64 === node.remote64);
            transceiver.lastSeen = new Date();
            transceiver.status = TRANSCIEVER_STATUS.ACTIF;
            // transceiver.type = node.deviceType ? node.deviceType : transceiver.type;
            if (node.remote16) {
                transceiver.address16 = node.remote16;
            }



            if (transceiver.pending && transceiver.pending.cfg) {
                obs = obs.pipe(mergeMap(r => this.applyConfiguration(transceiver, transceiver.pending.cfg, transceiver.pending.id, transceiver.pending.wasRouter)
                    .pipe(catchError(val => {
                        console.log('fail apply cfg', val);
                        return of(false);
                    }))
                ));
            }

            if (transceiver.type !== TRANSCIEVER_TYPE.ENDDEVICE && !hasPending) {
                obs = obs.pipe(mergeMap(() => this.checkLinks(transceiver)));
            } else if (transceiver.type === TRANSCIEVER_TYPE.ENDDEVICE) {
                transceiver.links = [];
            }
            elementToUpdate.push(transceiver);
        });


        obs = obs.pipe(mergeMap(_ => this.waitInitAO()));

        return obs.pipe(map((success: boolean) => success))
            // .pipe(mergeMap(success => success && elementToUpdate.length > 0 ? this.saveTransceiversToDB(elementToUpdate) : of(true)))
            .pipe(map(success => {
                //console.log('finish Update', !!success, elementToUpdate.map(x => x.address64)); //, !!success, elementToUpdate.map(x => x.address64), distinctNodes
                if (success) {
                    elementToUpdate.forEach(transceiverToUpdate => {
                        this.removeFromProccessList(String(transceiverToUpdate.address64));
                    });
                }
                return true;
            }))
            .pipe(catchError(val => {
                console.log('fail update', val);
                return of(false);
            }));
    }

    public proccessDeleteDevices(nodes: Array<any>): Observable<boolean | Array<Transceiver>> {
        const obs: Observable<any> = of(true);
        const elementToUpdate = [];
        const existingTransceivers = this.transceivers.filter(transceiverdB => transceiverdB.status === TRANSCIEVER_STATUS.ACTIF);
        existingTransceivers.forEach(existingTransceiver => {
            const exist = nodes.find(node => node.remote64 === existingTransceiver.address64);
            if (!exist) {
                const transceiver = this.transceivers.find(_transceiver => _transceiver.address64 === existingTransceiver.address64);
                existingTransceiver.status = existingTransceiver.type === TRANSCIEVER_TYPE.ENDDEVICE ? TRANSCIEVER_STATUS.SLEEPY : TRANSCIEVER_STATUS.INACTIF;
                transceiver.status = TRANSCIEVER_STATUS[existingTransceiver.status];
                elementToUpdate.push(transceiver);
            }
        });

        return obs.pipe(map((success: boolean) => success))
            // .pipe(mergeMap(success => success && elementToUpdate.length > 0 ? this.saveTransceiversToDB(elementToUpdate) : of(true)))
            .pipe(map(success => {
                elementToUpdate.forEach(transceiverToUpdate => {
                    // console.log('remove from list')
                    // this.removeFromProccessList(String(transceiverToUpdate.address64));
                });
                return true;
            }))
            .pipe(catchError(val => of(false)));
    }

    public addNewDevice(packet: any, elementsToAddObs: Array<Transceiver>): Observable<any> {
        const obs = packet.deviceType || packet.deviceType === 0 ? of(packet.deviceType) : this.getDeviceType(packet.remote64);

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

                // transceiver.links.forEach(_link => _link.status = 'INACTIF');

                const object = XbeeHelper.lqiTable(resultlqi.data);
                (object.neighborlqilist as any).forEach((neighborlqi: any) => {
                    const indexFound = transceiver.links ? transceiver.links.findIndex(_link => _link.target === neighborlqi.extAddr) : -1;
                    if (indexFound !== -1) {
                        transceiver.links[indexFound] = { source: transceiver.address64, target: neighborlqi.extAddr, lqi: neighborlqi.lqi, status: transceiver.status, type: 'AIR' };
                    } else if (transceiver.address64 !== neighborlqi.extAddr && [3, 1, 0].indexOf(neighborlqi.relationship) !== -1) {
                        const link = { source: transceiver.address64, target: neighborlqi.extAddr, lqi: neighborlqi.lqi, status: 'ACTIF', type: 'AIR' };
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
        return this.executeRemoteCommand(60000, 'SM', transceiverId)
            .pipe(map(response =>
                XbeeHelper.byteArrayToNumber(response.commandData) === 5 ? TRANSCIEVER_TYPE.ENDDEVICE : TRANSCIEVER_TYPE.ROUTER));
    }

    public disableSleep(adrress): Observable<any> {
        return this.executeRemoteCommand(60000, 'SM', adrress, [0], 0x02)
            .pipe(map(res => {
                console.log('sleep disabled', res);
                return true;
            }));
    }

    public enableSleep(transceiver: Transceiver): Observable<any> {
        return this.executeRemoteCommand(30000, 'SM', transceiver.address64, [5], 0)
            .pipe(tap(result => {
                console.log('sleep enabled', result);
            }));

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
                    console.log('error remote retry cmd', response, localCommandObj);
                    throw { response };
                }))), retryWhen(genericRetryStrategy({ durationBeforeRetry: 1, maxRetryAttempts: 3 }))
            )
            .pipe(catchError(error => {
                console.log('error remote cmd', error, localCommandObj);
                return of(undefined);
            }));
    }

    public waitInitAO(): Observable<any> {

        return of(true)
            .pipe(mergeMap(() => of(this.activeAO)
                .pipe(map((isActive: any) => {
                    if (!isActive) {
                        return true;
                    }
                    throw { isActive };
                }))), retryWhen(genericRetryStrategy({ durationBeforeRetry: 20, maxRetryAttempts: -1 }))
            );
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

    public setPendings(data: TransceiverEntity, toDelete = false): void {
        const foundIndex = this.transceivers.findIndex(_ => _.address64 === data.id);
        if (foundIndex !== -1) {
            const previousTransceiver = JSON.parse(JSON.stringify(this.transceivers[foundIndex]));
            if (data.pending) {
                const pendingTransceiver = new Transceiver();
                pendingTransceiver.address64 = data.pending.address;
                pendingTransceiver.type = data.pending.type;
                pendingTransceiver.sleepCfg = SleepCfg.convertToTrFormat((data.pending.configuration as any).sleepCfg);
                pendingTransceiver.iOCfg = (data.pending.configuration as any).IOCfg;

                const currentTransceiver = this.transceivers[foundIndex];
                currentTransceiver.type = pendingTransceiver.type;
                currentTransceiver.pending = {};
                currentTransceiver.pending.id = data.pending.id;
                currentTransceiver.pending.wasRouter = previousTransceiver.type === TRANSCIEVER_TYPE.ROUTER;
                currentTransceiver.pending.cfg = this.checkNeedApplyConfiguration(pendingTransceiver, previousTransceiver, currentTransceiver.pending.id);
            }
        }
    }

    public checkNeedApplyConfiguration(currentTransceiver: Transceiver, previousTransceiver: Transceiver, pendingId?: string): any {
        const diffIOCfg: any = detailedDiff(previousTransceiver.iOCfg, currentTransceiver.iOCfg);
        const diffSleepCfg: any = detailedDiff(previousTransceiver.sleepCfg, currentTransceiver.sleepCfg);
        let cfg;
        if (Object.keys(diffIOCfg.updated).length > 0) {
            cfg = {};
            for (const cmd of Object.keys(diffIOCfg.updated)) {
                const params = currentTransceiver.iOCfg[cmd];
                cfg[cmd] = currentTransceiver.iOCfg[cmd];
            }
        }
        if (Object.keys(diffSleepCfg.updated).length > 0) {
            if (!cfg) {
                cfg = {};
            }
            for (const cmd of Object.keys(diffSleepCfg.updated)) {
                const params = currentTransceiver.sleepCfg[cmd];
                if (cmd !== 'SM') {
                    if (cmd === 'ST') {
                        cfg.IR = currentTransceiver.sleepCfg[cmd];
                    }
                    cfg[cmd] = currentTransceiver.sleepCfg[cmd];
                }
            }
            cfg['V+'] = [255, 255];
        }
        if (previousTransceiver.type === TRANSCIEVER_TYPE.ROUTER && cfg) {
            this.applyConfiguration(currentTransceiver, cfg, pendingId, true).subscribe();
            return undefined;
        }
        return cfg;
    }

    public setApplyConfiguration(transceiver: Transceiver, configuration: any): Observable<any> {
        console.log('start unitary apply cfg');
        let cmdObs: Observable<boolean> = of(true);
        for (const cmd of Object.keys(configuration)) {
            const params = configuration[cmd];
            cmdObs = cmdObs.pipe(mergeMap(() => this.executeRemoteCommand(60000, cmd, transceiver.address64, params).pipe(map(() => true))));
        }
        return cmdObs;
    }

    public applyConfiguration(transceiver: Transceiver, configuration: any, pendingId?: string, wasRouter = false): Observable<any> {
        console.log('start apply cfg');
        return of(true)
            .pipe(mergeMap(() => !wasRouter ? this.executeRemoteCommand(60000, 'ST', transceiver.address64, [255, 254], 0x02) : of(true)))
            .pipe(mergeMap(() => this.setApplyConfiguration(transceiver, configuration)))
            .pipe(mergeMap(() => {
                console.log('enable/disable sleep cfg');
                if (transceiver.type === TRANSCIEVER_TYPE.ENDDEVICE) {
                    return wasRouter ? this.enableSleep(transceiver) : of(true);
                }
                return !wasRouter ? this.disableSleep(transceiver.address64) : of(true);
            }))
            .pipe(mergeMap(() => !wasRouter ? this.executeRemoteCommand(60000, 'ST', transceiver.address64, [19, 136], 0x00) : of(true)))
            .pipe(mergeMap(() => {
                console.log('write cfg');
                return this.executeRemoteCommand(60000, 'WR', transceiver.address64, undefined, 0x02);
            }))
            .pipe(mergeMap(result => this.transceiverService.applyPending(pendingId ? pendingId : transceiver.pending.id)));
    }

    public updateSleepMemoryRouters(dataUpdated: TransceiverEntity): void {
        const filtered = this.transceiverService.transceivers.filter(_ => _.type !== TRANSCIEVER_TYPE.ENDDEVICE);
        const sns = filtered.map(_ => (_.configuration as any).sleepCfg.SN);
        const sps = filtered.map(_ => (_.configuration as any).sleepCfg.SP);
        const maxSN = Math.max(...sns);
        const maxSP = Math.max(...sps);
        const newSP = (dataUpdated.configuration as any).sleepCfg.SP;
        const newSN = (dataUpdated.configuration as any).sleepCfg.SN;
        let cfg;
        if (maxSN < newSN) {
            cfg = { SN: XbeeHelper.numberToBytes(newSN) };
        }
        if (maxSP < newSP) {
            if (!cfg) {
                cfg = { SP: XbeeHelper.numberToBytes(newSP) };
            } else {
                cfg.SP = XbeeHelper.numberToBytes(newSP);
            }
        }
        if (cfg) {
            let cmdObs: Observable<boolean> = of(true);
            filtered.forEach(trans => {
                for (const cmd of Object.keys(cfg)) {
                    const params = cfg[cmd];
                    cmdObs = cmdObs.pipe(mergeMap(() =>
                        trans.type === TRANSCIEVER_TYPE.ROUTER ? this.executeRemoteCommand(60000, cmd, trans.id, params) : this.executeLocalCommand(cmd, params)
                            .pipe(map(() => true))));
                }
            });
            cmdObs.subscribe(() => console.log('update routers finish'));
        }
    }
}
