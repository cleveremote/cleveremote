import { of, Observable, from } from "rxjs";
import { mergeMap, tap, catchError, map } from "rxjs/operators";
import { KafkaService } from "../../kafka/services/kafka.service";
import { MapperService } from "../../common/mapper.service";
import { boxInfo, Tools } from "../../common/tools-service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { v1 } from 'uuid';
import { ISynchronizeParams, SYNC_TYPE, SYNC_ACTION, SEND_TYPE, ISynchronizer } from "../interfaces/entities.interface";
import { Payload } from '../../kafka/classes/payload.class';
import * as jsonSize from "json-size";
import { InjectRepository } from "@nestjs/typeorm";
import { SynchronizationExt } from "../repositories/synchronization.ext";
import { SynchronizationQueryDto } from "../dto/synchronization.dto";
import { TransceiverService } from "../../manager/services/transceiver.service";

@Injectable()
export class SynchronizerService {
    public servicesStore = [];
    public syncInProcess: boolean;
    private replayFailQueue: Array<any> = [];
    

    constructor(
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @InjectRepository(SynchronizationExt) private readonly synchronizationRepository: SynchronizationExt,
        @Inject(forwardRef(() => TransceiverService)) private readonly transceiverService: TransceiverService) {
        this.servicesStore.push(this.transceiverService);
    }

    public init(): Observable<boolean> {
        return this.synchronizationRepository.getAll()
            .pipe(tap(results => this.replayFailQueue = results && results.length ? results : []))
            .pipe(map(_ => true));

    }

    public remote(target: string, dataToSync: any, type = SYNC_TYPE.DB, action = SYNC_ACTION.NONE, entity: string, sendType = SEND_TYPE.ACK): void {
        const entityName = action === SYNC_ACTION.NONE ? dataToSync.constructor.name.replace('Entity', '') : entity;
        const typeAction: SYNC_ACTION = action === SYNC_ACTION.NONE ? ((Array.isArray(dataToSync) && dataToSync[0] && Object.keys(dataToSync[0]).filter(_ => _ === 'id').length === 1) || (!Array.isArray(dataToSync) && Object.keys(dataToSync).filter(_ => _ === 'id').length === 1) ? SYNC_ACTION.DELETE : SYNC_ACTION.SAVE) : action;

        const message = { sourceId: boxInfo.id, messageId: v1(), entity: entityName, action: typeAction, data: dataToSync };
        const payloads = [new Payload(`aggregator_${type}`, JSON.stringify(message), `aggregator_${type}.${target}`)]; // varaibiliser aggregator_
        if (boxInfo.isConnected) {
            switch (sendType) {
                case SEND_TYPE.SEND:
                    this.kafkaService.sendMessage(payloads, false)
                        .pipe(catchError(() => this.saveFailedSync(payloads)))
                        .subscribe();
                    break;
                case SEND_TYPE.ACK:
                    this.kafkaService.sendMessage(payloads, true)
                        .pipe(catchError(() => this.saveFailedSync(payloads)))
                        .subscribe();
                    break;
                case SEND_TYPE.DELIVERY:
                    this.kafkaService.sendDeliveryMessage(payloads)
                        .pipe(catchError(() => this.saveFailedSync(payloads)))
                        .subscribe();
                    break;

                default:
                    break;
            }
        } else {
            this.saveFailedSync(payloads).subscribe();
        }

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
        const needToSave = [];
        boxInfo.liveReload = false;
        boxInfo.isConnected = false;
        const _topic = payloads[0].topic;
        const _target = payloads[0].key;
        const message: ISynchronizeParams = JSON.parse(payloads[0].messages);
        if (Array.isArray(message.data)) {
            message.data.forEach(dataElement => {
                const dataSize = jsonSize(dataElement);
                const alreadyExists = this.replayFailQueue.find(_ => _.topic === _topic && _.target === _target && _.entity === message.entity && _.action === message.action && _.entityId === (dataElement.id || dataElement.entityId || dataElement));
                if (alreadyExists) {
                    if (alreadyExists.data !== dataElement) {
                        alreadyExists.data = dataElement;
                        alreadyExists.size = dataSize;
                        needToSave.push(alreadyExists);
                    }
                } else {
                    const elementToSave = { topic: _topic, target: _target, entity: message.entity, entityId: dataElement.id || dataElement.entityId || dataElement, action: message.action, data: dataElement, size: dataSize };
                    this.replayFailQueue.push(elementToSave);
                    needToSave.push(elementToSave);
                }
            });
        } else {
            const dataElement = message.data;
            const dataSize = jsonSize(dataElement);
            const alreadyExists = this.replayFailQueue.find(_ => _.topic === _topic && _.target === _target && _.entity === message.entity && _.action === message.action && _.entityId === (dataElement.id || dataElement.entityId || dataElement));
            if (alreadyExists) {
                if (alreadyExists.data !== dataElement) {
                    alreadyExists.data = dataElement;
                    alreadyExists.size = dataSize;
                    needToSave.push(alreadyExists);
                }
            } else {
                const elementToSave = { topic: _topic, target: _target, entity: message.entity, entityId: dataElement.id || dataElement.entityId || dataElement, action: message.action, data: dataElement, size: dataSize };
                this.replayFailQueue.push(elementToSave);
                needToSave.push(elementToSave);
            }
        }
        if (needToSave) {
            return from(this.synchronizationRepository.save(needToSave))
                .pipe(catchError(e => of(false)))
                .pipe(map(res => res ? true : false));
        }
        return of(true);
    }

    public replay(): Observable<boolean> {
        if (this.syncInProcess) {
            return of(true);
        }
        this.syncInProcess = true;
        // declare variable size in .env syncChunksize.
        const envMaxSize = 3000;
        const groupes = [...Tools.groupBy(this.replayFailQueue, client => [client.topic, client.target, client.entity, client.action])];
        const messageSent = []; // to remove
        let obs = of(true);
        groupes.forEach(groupRecords => {
            const message = { sourceId: boxInfo.id, messageId: v1(), entity: groupRecords[0].entity, action: groupRecords[0].action, data: undefined };
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
                    messageSent.push(payloads);
                    obs = obs.pipe(mergeMap(result => this.kafkaService.sendMessage(payloads, true)))
                        .pipe(mergeMap(_ => this.removeSynchronization([record])))
                        .pipe(catchError(() => this.saveFailedSync(payloads)))
                    // this.removeSynchronization(dataToSync).subscribe();
                    dataToSync = [notFitedRecord];
                }
            });
            message.data = dataToSync;
            const payloads = [new Payload(groupRecords[0].topic, JSON.stringify(message), groupRecords[0].target)];
            messageSent.push(payloads);
            obs = obs.pipe(mergeMap(result => this.kafkaService.sendMessage(payloads, true)))
                .pipe(mergeMap(_ => this.removeSynchronization([groupRecords[0]])))
                .pipe(catchError(() => this.saveFailedSync(payloads)));
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

}
