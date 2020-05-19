import { mergeMap, tap, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { TransceiverExt } from '../repositories/transceiver.ext';
import { InjectRepository } from '@nestjs/typeorm';
import { ModuleExt } from '../repositories/module.ext';
import { TransceiverDto } from '../dto/transceiver.dto';
import { TransceiverQueryDto } from '../dto/transceiver.query.dto';
import { forwardRef, Inject } from '@nestjs/common';
import { KafkaService } from '../../kafka/services/kafka.service';
import { TransceiverEntity } from '../entities/transceiver.entity';
import { SynchronizerService } from '../../synchronizer/services/synchronizer.service';
import { SYNC_TYPE, SYNC_ACTION, SEND_TYPE } from '../../synchronizer/interfaces/entities.interface';
import { ELEMENT_TYPE } from '../../websocket/services/interfaces/ws.message.interfaces';
import { ISynchronize, ISynchronizeParams, ISynchronizer } from '../interfaces/entities.interface';

export class TransceiverService implements ISynchronizer {
    public entityName = 'Transceiver';

    constructor(
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @InjectRepository(TransceiverExt) private readonly transceiverRepository: TransceiverExt,
        @InjectRepository(ModuleExt) private readonly moduleRepository: ModuleExt,
        @Inject(forwardRef(() => SynchronizerService)) private readonly synchronizerService: SynchronizerService
    ) { }

    public synchronize(params: ISynchronizeParams): Observable<boolean> {
        switch (params.action) {
            case 'SAVE':
                return this.save(params.data, true)
                    .pipe(map(_ => true));
            case 'DELETE':
                return this.delete(params.data, true)
                    .pipe(map(_ => true));
            default:
                break;
        }
    }

    public getDeviceId(id: string): Observable<string> {
        throw new Error("Method not implemented.");
    }

    public get(transceiverId: string): Observable<any> {
        return this.transceiverRepository.getTransceiver(transceiverId);
    }

    public getAll(transceiverQueryDto: TransceiverQueryDto): Observable<any> {
        return this.transceiverRepository.getAll(transceiverQueryDto);
    }

    public scanAll(deviceId: string): Observable<any> {
        const data = {};
        return this.kafkaService.sendBoxAction(data, 'SCAN', deviceId);
    }

    public generateModules(): Observable<any> {
        return of({});
    }

    public add(transceiverDto: TransceiverDto): Observable<any> {
        return this.transceiverRepository.addTransceiver(transceiverDto)
            .pipe(tap(transceiverEntity => this.synchronizerService.remote('server_1', transceiverEntity, SYNC_TYPE.DB, SYNC_ACTION.SAVE, ELEMENT_TYPE.TRANSCEIVER, SEND_TYPE.ACK)))
            .pipe(tap(transceiverEntity => this.synchronizerService.remoteWS(SYNC_ACTION.SAVE, ELEMENT_TYPE.TRANSCEIVER, transceiverEntity, [])));
    }

    public save(transceiverDto: Array<TransceiverDto | TransceiverEntity> | TransceiverDto, remote = false, request: any = []): Observable<any> {
        return this.transceiverRepository.saveTransceiver(transceiverDto)
            .pipe(tap(transceiverEntity => !remote ? this.synchronizerService.remote('server_1', transceiverEntity, SYNC_TYPE.DB, SYNC_ACTION.SAVE, ELEMENT_TYPE.TRANSCEIVER, SEND_TYPE.ACK) : of(true)))
            .pipe(tap(transceiverEntity => this.synchronizerService.remoteWS(SYNC_ACTION.SAVE, ELEMENT_TYPE.TRANSCEIVER, transceiverEntity, request)));
    }

    public delete(id: string, remote = false): Observable<any> {
        return this.transceiverRepository.deleteTransceiver(id)
            .pipe(tap(res => !remote ? this.synchronizerService.remote('server_1', [id], SYNC_TYPE.DB, SYNC_ACTION.DELETE, ELEMENT_TYPE.TRANSCEIVER, SEND_TYPE.ACK) : of(true)))
            .pipe(tap(transceiverEntity => this.synchronizerService.remoteWS(SYNC_ACTION.DELETE, ELEMENT_TYPE.TRANSCEIVER, transceiverEntity, [])));
    }
}
