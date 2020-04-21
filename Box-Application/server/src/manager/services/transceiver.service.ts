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

export class TransceiverService {
    public entityName = 'Transceiver';
    constructor(
        @Inject(forwardRef(() => ManagerService)) private readonly managerService: ManagerService,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @InjectRepository(TransceiverExt) private readonly transceiverRepository: TransceiverExt,
        @InjectRepository(ModuleExt) private readonly moduleRepository: ModuleExt
    ) { }

    public get(transceiverId: string): Observable<any> {
        return this.transceiverRepository.getTransceiver(transceiverId);
    }

    public getAll(transceiverQueryDto: TransceiverQueryDto): Observable<any> {
        return this.transceiverRepository.getAll(transceiverQueryDto);
    }

    public add(moduleDto: TransceiverDto): Observable<any> {
        return this.transceiverRepository.addTransceiver(moduleDto)
            .pipe(mergeMap((data: TransceiverEntity) => this.kafkaService.executeDbSync(data, 'ADD', this.entityName, this.managerService.deviceId)));
    }

    public update(moduleDto: Array<TransceiverDto | TransceiverEntity>): Observable<any> {
        return this.transceiverRepository.updateTransceiver(moduleDto);
        //.pipe(mergeMap((data: TransceiverEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, this.managerService.deviceId)));
    }

    public delete(id: string): Observable<any> {
        return this.transceiverRepository.deleteTransceiver(id)
            .pipe(mergeMap((isDeleted: boolean) => this.kafkaService.executeDbSync(id, 'DELETE', this.entityName, this.managerService.deviceId)));
    }

    public generateModules(): Observable<any> {
        return of({});
    }
}
