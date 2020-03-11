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
import { ModuleDto } from '../dto/module.dto';
import { ModuleQueryDto } from '../dto/module.query.dto';
import { SchemeExt } from '../repositories/scheme.ext';
import { SchemeQueryDto } from '../dto/scheme.query.dto';
import { SchemeDto } from '../dto/scheme.dto';

export class SchemeService {

    constructor(
        @InjectRepository(TransceiverExt) private transceiverRepository: TransceiverExt,
        @InjectRepository(SchemeExt) private schemeRepository: SchemeExt) { }

    public get(id: string): Observable<any> {
        return this.schemeRepository.getScheme(id);
    }

    public add(schemeDto: SchemeDto): Observable<any> {
        return this.schemeRepository.addScheme(schemeDto);
    }

    public update(schemeDto: SchemeDto): Observable<any> {
        return this.schemeRepository.updateScheme(schemeDto);
    }

    public delete(id: string): Observable<any> {
        return this.schemeRepository.deleteScheme(id);
    }

    public getAll(schemeQueryDto: SchemeQueryDto): Observable<any> {
        return this.schemeRepository.getAll(schemeQueryDto);
    }
}
