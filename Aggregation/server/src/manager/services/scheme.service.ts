import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap, mergeMap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from } from 'rxjs';
import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';
import { DeviceService } from './device.service';
import { TransceiverExt } from '../repositories/transceiver.ext';
import { InjectRepository } from '@nestjs/typeorm';
import { ModuleExt } from '../repositories/module.ext';
import { ModuleDto } from '../dto/module.dto';
import { ModuleQueryDto } from '../dto/module.query.dto';
import { SchemeExt } from '../repositories/scheme.ext';
import { SchemeQueryDto } from '../dto/scheme.query.dto';
import { SchemeDto } from '../dto/scheme.dto';

import { KafkaService } from '../../kafka/services/kafka.service';
import { forwardRef, Inject } from '@nestjs/common';
import { SchemeEntity } from '../entities/scheme.entity';

export class SchemeService {
    public entityName = 'Scheme';

    constructor(
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @InjectRepository(TransceiverExt) private readonly transceiverRepository: TransceiverExt,
        @InjectRepository(SchemeExt) private readonly schemeRepository: SchemeExt,
    ) { }

    public get(id: string): Observable<any> {
        return this.schemeRepository.getScheme(id);
    }

    public add(schemeDto: SchemeDto): Observable<any> {
        return this.schemeRepository.addScheme(schemeDto)
            .pipe(mergeMap((data: SchemeEntity) => this.kafkaService.syncDataWithBox(data, 'ADD', this.entityName, schemeDto.schemeId)));
    }

    public update(schemeDto: SchemeDto): Observable<any> {
        return this.schemeRepository.updateScheme(schemeDto)
            .pipe(mergeMap((data: SchemeEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, schemeDto.schemeId)));
    }

    public delete(id: string): Observable<any> {
        return this.schemeRepository.deleteScheme(id)
            .pipe(mergeMap((isDeleted: boolean) => this.kafkaService.syncDataWithBox(id, 'DELETE', this.entityName, id)));
    }

    public getAll(schemeQueryDto: SchemeQueryDto): Observable<any> {
        return this.schemeRepository.getAll(schemeQueryDto);
    }
}
