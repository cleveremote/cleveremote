
import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap, mergeMap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from } from 'rxjs';
import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';
import { TransceiverExt } from '../repositories/transceiver.ext';
import { InjectRepository } from '@nestjs/typeorm';
import { ModuleExt } from '../repositories/module.ext';
import { ModuleDto } from '../dto/module.dto';
import { ModuleQueryDto } from '../dto/module.query.dto';
import { KafkaService } from '../../kafka/services/kafka.service';
import { forwardRef, Inject } from '@nestjs/common';
import { ModuleEntity } from '../entities/module.entity';
import { DeviceExt } from '../repositories/device.ext';
import { DeviceDto } from '../dto/device.dto';
import { DeviceQueryDto } from '../dto/device.query.dto';

export class DeviceService {

    constructor(
        @InjectRepository(DeviceExt) private readonly deviceRepository: DeviceExt
    ) { }

    public get(id: string): Observable<any> {
        return this.deviceRepository.getDevice(id);
    }

    public add(deviceDto: DeviceDto): Observable<any> {
        return this.deviceRepository.addDevice(deviceDto);
    }

    public update(moduleDto: DeviceDto): Observable<any> {
        return this.deviceRepository.updateDevice(moduleDto);
    }

    public delete(id: string): Observable<any> {
        return this.deviceRepository.deleteDevice(id);
    }

    public getAll(deviceQueryDto: DeviceQueryDto): Observable<any> {
        return this.deviceRepository.getAll(deviceQueryDto);
    }
}

