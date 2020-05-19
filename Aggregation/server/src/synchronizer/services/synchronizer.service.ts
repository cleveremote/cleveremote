import { of, Observable, from, empty } from "rxjs";
import { mergeMap, tap, catchError, map } from "rxjs/operators";
import { KafkaService } from "../../kafka/services/kafka.service";
import { MapperService } from "../../common/mapper.service";
import { Tools } from "../../common/tools-service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { v1 } from 'uuid';
import { ISynchronizeParams, SYNC_TYPE, SYNC_ACTION, SEND_TYPE } from "../interfaces/entities.interface";
import { Payload } from '../../kafka/classes/payload.class';
import * as jsonSize from "json-size";
import { InjectRepository } from "@nestjs/typeorm";
import { SynchronizationExt } from "../repositories/synchronization.ext";
import { SynchronizationQueryDto } from "../dto/synchronization.dto";
import WebSocket = require("ws");
import * as jwt from 'jsonwebtoken';


import { WebSocketService, ExtWebSocket, MessageWs, IWebSocketError, IWebSocketEvent } from "../../websocket/services/websocket.service";
import { ELEMENT_TYPE } from "../../websocket/services/interfaces/ws.message.interfaces";
import { TransceiverService } from "../../manager/services/transceiver.service";
import { ISynchronize, ISynchronizer } from "../../manager/interfaces/entities.interface";
import { Any } from "typeorm";

@Injectable()
export class SynchronizerService {
    public devices: Array<any> = [];
    public servicesStore = [];
    public syncInProcess: boolean;
    private replayFailQueue: Array<any> = [];

    constructor(
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @InjectRepository(SynchronizationExt) private readonly synchronizationRepository: SynchronizationExt,

        @Inject(forwardRef(() => TransceiverService)) private readonly transceiverService: TransceiverService

    ) {
        this.servicesStore.push(this.transceiverService);
    }

    public init(): Observable<boolean> {
        return this.synchronizationRepository.getAll()
            .pipe(tap(results => this.replayFailQueue = results && results.length ? results : []))
            .pipe(mergeMap((result) => of(true)));
    }

    public remote(target: string, dataToSync: any, type = SYNC_TYPE.DB, action = SYNC_ACTION.NONE, entity: ELEMENT_TYPE, sendType = SEND_TYPE.ACK, force = false, returnResult = false): void | Observable<any> {

        let response: any;
        const entityName = action === SYNC_ACTION.NONE ? dataToSync.constructor.name.replace('Entity', '') : entity;
        const typeAction: SYNC_ACTION = action === SYNC_ACTION.NONE ? ((Array.isArray(dataToSync) && dataToSync[0] && Object.keys(dataToSync[0]).filter(_ => _ === 'id').length === 1) || (!Array.isArray(dataToSync) && Object.keys(dataToSync).filter(_ => _ === 'id').length === 1) ? SYNC_ACTION.DELETE : SYNC_ACTION.SAVE) : action;

        const message = { sourceId: 'aggregator_server', messageId: v1(), entity: entityName, action: typeAction, data: dataToSync };
        const payloads = [new Payload(`box_${type}`, JSON.stringify(message), `box_${type}.${target}`)]; // varaibiliser box_
        const device = this.devices.find(_ => _.deviceId === target);
        const icConnected = device && device.isConnected ? true : false;
        if (icConnected || force) {
            switch (sendType) {
                case SEND_TYPE.SEND:
                    response = this.kafkaService.sendMessage(payloads, false)
                        .pipe(catchError(e => of(false)));
                    break;
                case SEND_TYPE.ACK:
                    response = this.kafkaService.sendMessage(payloads, true)
                        .pipe(catchError(() => this.saveFailedSync(payloads)));
                    break;
                case SEND_TYPE.DELIVERY:
                    response = this.kafkaService.sendDeliveryMessage(payloads, true)
                        .pipe(catchError(e => of(false)));
                    break;

                default:
                    break;
            }
        } else {
            response = this.saveFailedSync(payloads);
        }

        return returnResult ? response : response.subscribe();
    }

    public local(data: ISynchronizeParams): any {
        const serviceName = data.entity;
        const serviceClass = `${serviceName}Service`;
        const serviceInstance = this.servicesStore.find((service: any) => service.constructor.name === serviceClass);
        if (!serviceInstance) {
            throw new Error(`Class type of \'${serviceName}\' is not in the store`);
        }
        return (serviceInstance as ISynchronizer).synchronize(data)
            .pipe(mergeMap(() => this.kafkaService.sendAck({ messageId: data.messageId, ack: true }, data.sourceId)))
            .pipe(catchError(e => of(false)))
            .subscribe();
    }

    public saveFailedSync(payloads: Array<Payload>): Observable<boolean> {
        const _topic = payloads[0].topic;
        const _target = payloads[0].key;

        const currentDevice = this.devices.find(_ => _.deviceId === _target.split('.')[1]);
        currentDevice.isConnected = false;

        const message: ISynchronizeParams = JSON.parse(payloads[0].messages);
        if (Array.isArray(message.data)) {
            message.data.forEach(dataElement => {
                const dataSize = jsonSize(dataElement);
                const alreadyExists = this.replayFailQueue.find(_ => _.topic === _topic && _.target === _target && _.entity === message.entity && _.action === message.action && _.entityId === dataElement.id || dataElement.entityId);
                if (alreadyExists) {
                    alreadyExists.data = dataElement;
                    alreadyExists.size = dataSize;
                } else {
                    const elementToSave = { topic: _topic, target: _target, entity: message.entity, entityId: dataElement.id || dataElement.entityId, action: message.action, data: dataElement, size: dataSize };
                    this.replayFailQueue.push(elementToSave);
                }
            });
        } else {
            const dataElement = message.data;
            const dataSize = jsonSize(dataElement);
            const alreadyExists = this.replayFailQueue.find(_ => _.topic === _topic && _.target === _target && _.entity === message.entity && _.action === message.action && _.entityId === dataElement.id || dataElement.entityId);
            if (alreadyExists) {
                alreadyExists.data = dataElement;
                alreadyExists.size = dataSize;
            } else {
                const elementToSave = { topic: _topic, target: _target, entity: message.entity, entityId: dataElement.id || dataElement.entityId, action: message.action, data: dataElement, size: dataSize };
                this.replayFailQueue.push(elementToSave);
            }
        }

        return from(this.synchronizationRepository.save(this.replayFailQueue))
            .pipe(catchError(e => of(false)))
            .pipe(map(res => res ? true : false));

    }

    // public replay(deviceId: string): void {
    //     // declare variable size in .env syncChunksize.
    //     const envMaxSize = 3000;
    //     let groupes = [...Tools.groupBy(this.replayFailQueue, client => [client.topic, client.target, client.entity, client.action])];
    //     const regex = RegExp(deviceId);
    //     groupes = groupes.filter(_ => regex.test(_[0].target));
    //     const messageSent = [];
    //     groupes.forEach(groupRecords => {
    //         const message = { sourceId: 'aggregator_server', messageId: v1(), entity: groupRecords[0].entity, action: groupRecords[0].action, data: undefined };
    //         let dataToSync = [];
    //         let size = 0;
    //         groupRecords.forEach(record => {
    //             dataToSync.push(record.data);
    //             size = size + Number(record.size);
    //             if (size > envMaxSize) {
    //                 const notFitedRecord = dataToSync.pop();
    //                 size = 0;
    //                 message.data = dataToSync;
    //                 const payloads = [new Payload(record.topic, JSON.stringify(message), record.target)];
    //                 messageSent.push(payloads);
    //                 this.kafkaService.sendMessage(payloads, true)
    //                     .pipe(mergeMap(_ => this.removeSynchronization(dataToSync)))
    //                     .pipe(catchError(() => this.saveFailedSync(payloads)))
    //                     .subscribe();
    //                 dataToSync = [notFitedRecord];
    //             }
    //         });
    //         message.data = dataToSync;
    //         const payloads = [new Payload(groupRecords[0].topic, JSON.stringify(message), groupRecords[0].target)];
    //         messageSent.push(payloads);
    //         this.removeSynchronization(dataToSync).subscribe();
    //     });
    // }

    public replay(deviceId: string): Observable<boolean> {
        if (this.syncInProcess) {
            return of(true);
        }
        this.syncInProcess = true;
        // declare variable size in .env syncChunksize.
        const envMaxSize = 3000;
        let groupes = [...Tools.groupBy(this.replayFailQueue, client => [client.topic, client.target, client.entity, client.action])];
        const regex = RegExp(deviceId);
        groupes = groupes.filter(_ => regex.test(_[0].target));
        let obs = of(true);
        groupes.forEach(groupRecords => {
            const message = { sourceId: 'aggregator_server', messageId: v1(), entity: groupRecords[0].entity, action: groupRecords[0].action, data: undefined };
            let dataToSync = [];
            let size = 0;
            groupRecords.forEach(record => {
                dataToSync.push(record.data);
                size = size + Number(record.size);
                if (size > envMaxSize) {
                    const notFitedRecord = dataToSync.pop();
                    size = 0;
                    message.data = dataToSync;
                    const payloads = [new Payload(record.topic, JSON.stringify(message), record.target)];
                    obs = obs.pipe(mergeMap(result => this.kafkaService.sendMessage(payloads, true)))
                        .pipe(mergeMap(_ => this.removeSynchronization([record])))
                        .pipe(catchError(() => this.saveFailedSync(payloads)))
                    // this.removeSynchronization(dataToSync).subscribe();
                    dataToSync = [notFitedRecord];
                }
            });
            message.data = dataToSync;
            const payloads = [new Payload(groupRecords[0].topic, JSON.stringify(message), groupRecords[0].target)];
            obs = obs.pipe(mergeMap(result => this.kafkaService.sendMessage(payloads, true)))
                .pipe(mergeMap(_ => this.removeSynchronization([groupRecords[0]])))
                .pipe(catchError(() => this.saveFailedSync(payloads)))
        });
        return obs.pipe(tap(result => this.syncInProcess = false));
    }

    public removeSynchronization(records: Array<SynchronizationQueryDto>): Observable<boolean> {
        const recordsDto = records.map(_ => ({ topic: _.topic, target: _.target, entity: _.entity, entityId: _.entityId, action: _.action }));
        return this.synchronizationRepository.deleteSynchronization(recordsDto)
            .pipe(tap(result => {
                if (result) {
                    records.forEach(record => {
                        const indexToDelete = this.replayFailQueue.findIndex(_ => _.target === record.target && _.entity === record.entity && _.entityId === record.entityId && _.action === record.action && _.topic === record.topic);
                        this.replayFailQueue.splice(indexToDelete, 1);
                    });
                }
            }));
    }

    public checkBoxesConnectivity(devices: Array<any>): void {
        const t = devices;
    }

    /////////////websockets

    public startCheckConnectivity(): void {
        setInterval(() => {
            this.getWsClientsDevice('server_1');
            this.checkDevicesConnectivity();
        }, 3000);
    }

    public remoteWS(typeAction: SYNC_ACTION, target: ELEMENT_TYPE, entity: any, request: any): void {
        WebSocketService.syncClients(typeAction, target, entity, request);
    }

    public localWS(event: IWebSocketEvent): any {
        const message = JSON.parse(event.data as string);
        if (message.type === 'VISIBILITY') {
            (event.target as any).userInfo.data.visible = message.visible;
            this.setLiveRefresh(event);
        }
    }

    public setLiveRefresh(event: any): void {
        const userInfo = event.target && event.target.userInfo;
        const allClients: Array<any> = [...WebSocketService.wss.clients];
        const accountVisibleClients = allClients.filter(client => client.userInfo && client.userInfo.data.accountId === userInfo.data.accountId && client.userInfo.data.visible && client.userInfo.data.devices.length > 0);
        if (accountVisibleClients.length === 0) {
            this.notifyBoxes([event.target], false, false);
        } else {
            this.notifyBoxes([event.target], true);
        }
    }

    public checkDevicesConnectivity(): void {
        this.devices.forEach(device => {
            const dataToSync = { liveReload: device.liveReload };
            const checkConnection = this.remote(device.deviceId, dataToSync, SYNC_TYPE.ACTION, SYNC_ACTION.GET, ELEMENT_TYPE.CONNECTIVITY, SEND_TYPE.DELIVERY, true, true) as Observable<any>;
            checkConnection.pipe(map(result => {
                // if (device.isConnected !== !!result) {
                device.isConnected = !!result;
                if (device.isConnected) {
                    this.replay(device.deviceId).subscribe();
                }
                const clientToNotify = this.getWsClientsDevice(device.deviceId);
                clientToNotify.forEach(client => {
                    const data = { data: [{ id: device.deviceId, status: device.isConnected }], typeAction: 'Connectivity' };
                    const message = JSON.stringify(new MessageWs(JSON.stringify(data), false, undefined));
                    client.send(message);
                });
                // }
            })).subscribe();
        });
    }

    public getWsClientsDevice(device: string): Array<any> {
        const clientToNotify = [];
        const allClients = [...WebSocketService.wss.clients];
        const groupedBy = [...Tools.groupBy(allClients, client => client.userInfo && client.userInfo.data.devices ? [client.userInfo.data.devices] : undefined)];
        const t = groupedBy;
        const groupToNotify = groupedBy.filter(grp => grp[0].userInfo && grp[0].userInfo.data.devices.find(_ => _.id === device) ? true : false);
        groupToNotify.forEach(grp => {
            grp.forEach(client => {
                clientToNotify.push(client);
            });
        });
        return clientToNotify;
    }

    public notifyBoxes(accountClients: Array<any>, liveRefresh: boolean, notify = true): void {
        const devices: Array<any> = this.devices.filter(device => accountClients[0].userInfo.data.devices.map(x => x.id).indexOf(device.deviceId) !== -1);
        devices.forEach(device => {
            if (device.liveReload !== liveRefresh) {
                const payloads = [
                    {
                        topic: `box_action`,
                        messages: JSON.stringify({ messageId: v1(), action: SYNC_ACTION.NOTIFY, entity: 'Connectivity', data: { liveReload: liveRefresh } }),
                        key: `box_action.${device.deviceId}`
                    }
                ];
                KafkaService.instance.sendMessage(payloads, true, 'aggregator_ack', 3500)
                    .pipe(catchError(e => {
                        device.isConnected = false;
                        const boxId = e.error[0].key.split('.')[1];
                        return of({ key: boxId, fail: true });
                    }))
                    .pipe(tap((response: any) => {
                        device.liveReload = liveRefresh;
                        const boxId = response.key || (response[0] && response[0].key);
                        if (boxId && notify) {
                            const data = response.fail ? { data: [{ id: boxId, status: false }], typeAction: 'Connectivity' } : { data: [{ id: boxId, status: true }], typeAction: 'Connectivity' };
                            accountClients.forEach(client => {
                                client.userInfo.data.devices.find(_ => _.id === boxId).status = response.fail ? false : true;
                                const message = JSON.stringify(new MessageWs(JSON.stringify(data), false, undefined));
                                client.send(message);
                            });
                        }
                    })).subscribe();
            }
        });
    }

}
