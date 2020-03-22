import { mergeMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { TransceiverExt } from '../repositories/transceiver.ext';
import { InjectRepository } from '@nestjs/typeorm';
import { ModuleExt } from '../repositories/module.ext';
import { TransceiverDto } from '../dto/transceiver.dto';
import { TransceiverQueryDto } from '../dto/transceiver.query.dto';
import { forwardRef, Inject } from '@nestjs/common';
import { KafkaService } from '../../kafka/services/kafka.service';
import { TransceiverEntity } from '../entities/transceiver.entity';
import { ManagerService } from './manager.service';
import { XbeeService } from '../../xbee/services/xbee.service';

export class TransceiverService {
    public entityName = 'Transceiver';
    constructor(
        @Inject(forwardRef(() => ManagerService)) private readonly managerService: ManagerService,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @InjectRepository(TransceiverExt) private readonly transceiverRepository: TransceiverExt,
        @InjectRepository(ModuleExt) private readonly moduleRepository: ModuleExt,
        @Inject(forwardRef(() => XbeeService)) private readonly xbeeService: XbeeService
    ) { }

    public get(transceiverId: string): Observable<any> {
        return this.transceiverRepository.getTransceiver(transceiverId);
    }

    public getAll(transceiverQueryDto: TransceiverQueryDto): Observable<any> {
        return this.transceiverRepository.getAll(transceiverQueryDto);
    }

    public add(moduleDto: TransceiverDto): Observable<any> {
        return this.transceiverRepository.addTransceiver(moduleDto)
            .pipe(mergeMap((data: TransceiverEntity) => this.kafkaService.syncDataWithBox(data, 'ADD', this.entityName, this.managerService.deviceId)));
    }

    public update(moduleDto: TransceiverDto): Observable<any> {
        return this.transceiverRepository.updateTransceiver(moduleDto)
            .pipe(mergeMap((data: TransceiverEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, this.managerService.deviceId)));
    }

    public delete(id: string): Observable<any> {
        return this.transceiverRepository.deleteTransceiver(id)
            .pipe(mergeMap((isDeleted: boolean) => this.kafkaService.syncDataWithBox(id, 'DELETE', this.entityName, this.managerService.deviceId)));
    }

    public scanAll(): Observable<any> {
        return this.xbeeService.initTransceivers();
    }

    public generateModules(): Observable<any> {
        return of({});
    }
}
