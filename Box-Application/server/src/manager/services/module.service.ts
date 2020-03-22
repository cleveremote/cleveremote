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
import { KafkaService } from '../../kafka/services/kafka.service';
import { forwardRef, Inject } from '@nestjs/common';
import { ModuleEntity } from '../entities/module.entity';
import { ManagerService } from './manager.service';

export class ModuleService {

    public entityName = 'Module';
    constructor(
        @Inject(forwardRef(() => ManagerService)) private readonly managerService: ManagerService,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @InjectRepository(ModuleExt) private readonly moduleRepository: ModuleExt) { }

    public get(id: string): Observable<any> {
        return this.moduleRepository.getModule(id);
    }

    public add(moduleDto: ModuleDto): Observable<any> {
        return this.moduleRepository.addModule(moduleDto)
            .pipe(mergeMap((data: ModuleEntity) => this.kafkaService.syncDataWithBox(data, 'ADD', this.entityName, this.managerService.deviceId)));
    }

    public update(moduleDto: ModuleDto): Observable<any> {
        return this.moduleRepository.updateModule(moduleDto)
            .pipe(mergeMap((data: ModuleEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, this.managerService.deviceId)));
    }

    public delete(id: string): Observable<any> {
        return this.moduleRepository.deleteModule(id)
            .pipe(mergeMap((isDeleted: boolean) => this.kafkaService.syncDataWithBox(id, 'DELETE', this.entityName, this.managerService.deviceId)));
    }

    public getAll(moduleQueryDto: ModuleQueryDto): Observable<any> {
        return this.moduleRepository.getAll(moduleQueryDto);
    }
}
