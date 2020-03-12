import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from } from 'rxjs';
import * as xbeeRx from 'xbee-rx'; // no types ... :(
import * as SerialPort from 'serialport';
import { DeviceService } from './device.service';
import { TransceiverExt } from '../repositories/transceiver.ext';
import { InjectRepository } from '@nestjs/typeorm';
import { ModuleExt } from '../repositories/module.ext';
import { TransceiverDto } from '../dto/transceiver.dto';
import { TransceiverQueryDto } from '../dto/transceiver.query.dto copy';
import { XbeeService } from '../../xbee/services/xbee.service';
import { forwardRef, Inject } from '@nestjs/common';

export class TransceiverService {

    constructor(
        @InjectRepository(TransceiverExt) private readonly transceiverRepository: TransceiverExt,
        @InjectRepository(ModuleExt) private readonly moduleRepository: ModuleExt,
        @Inject(forwardRef(() => XbeeService)) private readonly xbeeService: XbeeService) { }

    public get(transceiverId: string): Observable<any> {
        return this.transceiverRepository.getTransceiver(transceiverId);
    }

    public add(moduleDto: TransceiverDto): Observable<any> {
        return this.transceiverRepository.addTransceiver(moduleDto);
    }

    public update(moduleDto: TransceiverDto): Observable<any> {
        return this.transceiverRepository.updateTransceiver(moduleDto);
    }

    public delete(id: string): Observable<any> {
        return this.transceiverRepository.deleteTransceiver(id);
    }

    public getAll(transceiverQueryDto: TransceiverQueryDto): Observable<any> {
        return this.transceiverRepository.getAll(transceiverQueryDto);
    }

    public scanAll(): Observable<any> {
        return this.xbeeService.initTransceivers();
    }

    public generateModules(): Observable<any> {
        return of({});
    }
}
