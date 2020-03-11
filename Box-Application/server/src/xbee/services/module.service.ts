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

export class ModuleService {

    constructor(
        @InjectRepository(TransceiverExt) private transceiverRepository: TransceiverExt,
        @InjectRepository(ModuleExt) private moduleRepository: ModuleExt) { }

    public get(id: string): Observable<any> {
        return this.moduleRepository.getModule(id);
    }

    public add(moduleDto: ModuleDto): Observable<any> {
        return this.moduleRepository.addModule(moduleDto);
    }

    public update(id, moduleDto: ModuleDto): Observable<any> {
        return this.moduleRepository.updateModule(id, moduleDto);
    }

    public delete(id: string): Observable<any> {
        return this.moduleRepository.deleteModule(id);
    }

    public getAll(moduleQueryDto: ModuleQueryDto): Observable<any> {
        return this.moduleRepository.getAll(moduleQueryDto);
    }




    // public switchDigital(port: string, value: boolean, address: string): Observable<any> {
    //     return this.xbee.remoteCommand({
    //         command: port,
    //         commandParameter: [value ? 5 : 4],
    //         destination64: address// '0013a20040b971f3'
    //     }).pipe(map((response: any) => response));
    // }

    // public configureModule(configuration: any): any {
    //     // configuration module port Digital/out/in/spi/ad...
    //     return {};
    // }
}
