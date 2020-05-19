import { mergeMap, tap, map, catchError } from 'rxjs/operators';
import { Observable, of, pipe, merge } from 'rxjs';
import { TransceiverExt } from '../repositories/transceiver.ext';
import { InjectRepository } from '@nestjs/typeorm';
import { ModuleExt } from '../repositories/module.ext';
import { TransceiverDto } from '../dto/transceiver.dto';
import { TransceiverQueryDto } from '../dto/transceiver.query.dto';
import { forwardRef, Inject } from '@nestjs/common';
import { KafkaService } from '../../kafka/services/kafka.service';
import { TransceiverEntity } from '../entities/transceiver.entity';
import { ManagerService } from './manager.service';
import { SYNC_TYPE, SYNC_ACTION, SEND_TYPE, ISynchronizeParams, ISynchronizer } from '../../synchronizer/interfaces/entities.interface';
import { SynchronizerService } from '../../synchronizer/services/synchronizer.service';
import { XbeeService } from '../../xbee/services/xbee.service';
import { Transceiver } from '../../xbee/classes/transceiver.class';
import { SleepCfg } from '../../xbee/classes/sleepcfg.class';
import { TRANSCIEVER_TYPE } from '../../xbee/classes/device.class';
import { ModuleEntity } from '../entities/module.entity';
import { v1 } from 'uuid';

export class TransceiverService implements ISynchronizer {
    public entityName = 'Transceiver';
    public transceivers: Array<TransceiverEntity> = [];
    constructor(
        @InjectRepository(TransceiverExt) private readonly transceiverRepository: TransceiverExt,
        @Inject(forwardRef(() => SynchronizerService)) private readonly synchronizerService: SynchronizerService,
        @Inject(forwardRef(() => XbeeService)) private readonly xbeeService: XbeeService
    ) { }

    public synchronize(params: ISynchronizeParams): Observable<boolean> {
        switch (params.action) {
            case 'SAVE':
                return this.save(params.data, true, false)
                    .pipe(map(_ => true));
            default:
                break;
        }
    }

    public get(transceiverId: string): Observable<any> {
        return this.transceiverRepository.getTransceiver(transceiverId);
    }

    public getAll(transceiverQueryDto: TransceiverQueryDto): Observable<any> {
        return this.transceiverRepository.getAll(transceiverQueryDto);
    }

    public add(moduleDto: TransceiverDto): Observable<any> {
        return this.transceiverRepository.addTransceiver(moduleDto)
            .pipe(tap(transceiverEntity => this.synchronizerService.remote('aggregator_server', transceiverEntity, SYNC_TYPE.DB, SYNC_ACTION.SAVE, 'Transceiver', SEND_TYPE.ACK)));
    }

    public save(moduleDto: Array<TransceiverDto | TransceiverEntity>, remote = false, auto = true): Observable<any> {
        return this.transceiverRepository.saveTransceiver(moduleDto)
            .pipe(tap(entities => this.updateTransceiverList(entities)))
            .pipe(tap(transceiverEntity => !remote ? this.synchronizerService.remote('aggregator_server', transceiverEntity, SYNC_TYPE.DB, SYNC_ACTION.SAVE, 'Transceiver', SEND_TYPE.ACK) : false));
    }

    public delete(ids: Array<string>): Observable<any> {
        return this.transceiverRepository.deleteTransceiver(ids)
            .pipe(tap(transceiverEntity => this.synchronizerService.remote('aggregator_server', ids, SYNC_TYPE.DB, SYNC_ACTION.DELETE, 'Transceiver', SEND_TYPE.ACK)));
    }

    public generateModules(): Observable<any> {
        return of({});
    }

    public updateTransceiverList(entities: Array<TransceiverEntity> | TransceiverEntity): Array<TransceiverEntity> {
        if (Array.isArray(entities)) {
            entities.forEach(entity => {
                this.xbeeService.setPendings(entity);
            });
        } else {
            const entity = entities;
            this.xbeeService.setPendings(entity);
        }

        return this.transceivers;
    }

    public saveTransceiversToDB(transceivers: Array<Transceiver>): Observable<Array<Transceiver> | boolean> {
        const dtos: Array<TransceiverEntity> = [];
        transceivers.forEach(transceiver => {
            const record = this.buildTransceiverRecord(transceiver);
            dtos.push(record);
        });
        return this.save(dtos, false, true)
            .pipe(map((entities: Array<TransceiverEntity>) => {
                entities.forEach(entity => {
                    const foundIndex = this.transceivers.findIndex(transceiverdB => transceiverdB.address === entity.address);
                    if (foundIndex === -1) {
                        this.transceivers.push(entity);
                    } else {
                        this.transceivers[foundIndex] = entity;
                    }
                });
                return transceivers;
            }))
            .pipe(catchError(val => of(false)));
    }

    public buildTransceiverRecord(transceiver: Transceiver): TransceiverEntity {
        const transceiverEntity = this.transceivers.find(transceiverdB => transceiverdB.id === transceiver.address64);
        let dto: TransceiverEntity;
        if (!transceiverEntity) {
            const transceiverAddress64 = String(transceiver.address64);
            dto = new TransceiverEntity();
            dto.id = transceiverAddress64;
            dto.name = 'R(n)';
            dto.description = 'description Router(n)';
            dto.deviceId = 'server_1';
            dto.address = transceiverAddress64;
            dto.type = transceiver.type;
            if (transceiver.type === TRANSCIEVER_TYPE.ENDDEVICE) {
                transceiver.links = [];
            }
            dto.configuration = { sleepCfg: SleepCfg.convertToDBFormat(transceiver.sleepCfg), IOCfg: transceiver.iOCfg };
            dto.status = !transceiver.status ? 'ACTIF' : transceiver.status;
            dto.modules = [];
            if (transceiver.iOCfg) {
                for (const port of Object.keys(transceiver.iOCfg)) {
                    if(port!=='V+'){
                        const module = new ModuleEntity();
                        module.id = v1();
                        module.port = port;
                        module.status = !transceiver.status ? 'ACTIF' : transceiver.status;
                        module.name = `name_${module.id}`;
                        module.transceiverId = transceiverAddress64;
                        dto.modules.push(module);
                    }
                }
            }
        } else {
            transceiverEntity.type = transceiver.type;
            transceiverEntity.configuration = { sleepCfg: SleepCfg.convertToDBFormat(transceiver.sleepCfg), IOCfg: transceiver.iOCfg };
            transceiverEntity.status = !transceiver.status ? 'ACTIF' : transceiver.status;
            transceiverEntity.modules.forEach(module => {
                module.status = !transceiver.status ? 'ACTIF' : transceiver.status;
            });
            dto = transceiverEntity;
        }

        return dto;
    }

    public applyPending(pendingId: string): Observable<any> {
        return this.get(pendingId)
            .pipe(mergeMap((pendingEntity: TransceiverEntity) => {
                if (!pendingEntity) {
                    return of(false);
                }
                return this.get(pendingEntity.address)
                    .pipe(mergeMap(original => {
                        original.configuration = pendingEntity.configuration;
                        original.pending = null;
                        original.type = pendingEntity.type;
                        //  const idToDelete = pendingEntity.id;
                        //  pendingEntity.id = pendingEntity.address;
                        //  pendingEntity.pending = null;
                        return this.save([original])
                            .pipe(mergeMap(result => this.delete([pendingEntity.id])))
                            .pipe(tap((res) => {
                                const trnasceiverIndex = this.xbeeService.transceivers.findIndex(_ => _.address64 === original.id);
                                if (trnasceiverIndex !== -1) {
                                    const data = original;
                                    const transceiver = new Transceiver();
                                    transceiver.address64 = data.address;
                                    transceiver.type = data.type;
                                    transceiver.sleepCfg = SleepCfg.convertToTrFormat(data.configuration.sleepCfg);
                                    transceiver.iOCfg = data.configuration.IOCfg;
                                    transceiver.links = undefined;
                                    transceiver.pending = undefined;
                                    this.xbeeService.transceivers[trnasceiverIndex] = transceiver;
                                    console.log('finish apply cfg');
                                    if (data.type === TRANSCIEVER_TYPE.ENDDEVICE) {
                                        console.log('update coordinator and router');
                                        this.xbeeService.updateSleepMemoryRouters(data);
                                    }
                                }
                            }));
                    }));
            }
            ));
    }
}
