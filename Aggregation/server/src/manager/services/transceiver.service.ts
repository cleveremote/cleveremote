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

export class TransceiverService {
    public entityName = 'Transceiver';

    constructor(
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

    public scanAll(): Observable<any> {
        return of(true);
    }

    public generateModules(): Observable<any> {
        return of({});
    }

    public add(moduleDto: TransceiverDto): Observable<any> {
        return this.transceiverRepository.addTransceiver(moduleDto)
            .pipe(mergeMap((data: TransceiverEntity) => this.kafkaService.syncDataWithBox(data, 'ADD', this.entityName, moduleDto.id)));
    }

    public update(moduleDto: TransceiverDto): Observable<any> {
        return this.transceiverRepository.updateTransceiver(moduleDto)
            .pipe(mergeMap((data: TransceiverEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, moduleDto.id)));
    }

    public delete(id: string): Observable<any> {
        return this.transceiverRepository.deleteTransceiver(id)
            .pipe(mergeMap((isDeleted: boolean) => this.kafkaService.syncDataWithBox(id, 'DELETE', this.entityName, id)));
    }
}
