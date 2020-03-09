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

export class TransceiverService {

    constructor(
        @InjectRepository(TransceiverExt) private transceiverRepository: TransceiverExt,
        @InjectRepository(ModuleExt) private moduleRepository: ModuleExt) { }

    public get(id: string): Observable<any> {
        return this.transceiverRepository.getTransceiver(id);
    }

    public add(moduleDto: TransceiverDto): Observable<any> {
        return this.transceiverRepository.addTransceiver(moduleDto);
    }

    public update(id: string, moduleDto: TransceiverDto): Observable<any> {
        return this.transceiverRepository.updateTransceiver(id, moduleDto);
    }

    public delete(id: string): Observable<any> {
        return this.transceiverRepository.deleteTransceiver(id);
    }

    public getAll(): Observable<any> {
        return this.transceiverRepository.getAll();
    }

    public generateModules(): Observable<any> {
        return of({});
    }
}
