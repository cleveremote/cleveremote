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
import { SectorExt } from '../repositories/sector.ext';
import { SectorQueryDto } from '../dto/sector.query.dto';
import { SectorDto } from '../dto/sector.dto';

export class SectorService {

    constructor(
        @InjectRepository(SectorExt) private sectorRepository: SectorExt) { }

    public get(id: string): Observable<any> {
        return this.sectorRepository.getSector(id);
    }

    public add(sectorDto: SectorDto): Observable<any> {
        return this.sectorRepository.addSector(sectorDto);
    }

    public update(sectorDto: SectorDto): Observable<any> {
        return this.sectorRepository.updateSector(sectorDto);
    }

    public delete(id: string): Observable<any> {
        return this.sectorRepository.deleteSector(id);
    }

    public getAll(sectorQueryDto: SectorQueryDto): Observable<any> {
        return this.sectorRepository.getAll(sectorQueryDto);
    }
}
