import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap, mergeMap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from, bindCallback } from 'rxjs';
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
import { ManagerService } from './manager.service';
import * as fs from "fs";
import { SectorEntity } from '../entities/sector.entity';

import { v1 } from 'uuid';
import { SectorDto } from '../dto/sector.dto';

export class SchemeService {
    public entityName = 'Scheme';
    constructor(
        @Inject(forwardRef(() => ManagerService)) private readonly managerService: ManagerService,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @InjectRepository(TransceiverExt) private readonly transceiverRepository: TransceiverExt,
        @InjectRepository(SchemeExt) private readonly schemeRepository: SchemeExt,
    ) { }

    public get(id: string): Observable<any> {
        return this.schemeRepository.getScheme(id);
    }

    public add(schemeDto: SchemeDto): Observable<any> {
        return this.schemeRepository.addScheme(schemeDto)
            .pipe(mergeMap((data: SchemeEntity) => this.kafkaService.syncDataWithBox(data, 'ADD', this.entityName, this.managerService.deviceId)));
    }

    public update(schemeDto: SchemeDto): Observable<any> {
        return this.schemeRepository.updateScheme(schemeDto)
            .pipe(mergeMap((data: SchemeEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, this.managerService.deviceId)));
    }

    public delete(id: string): Observable<any> {
        return this.schemeRepository.deleteScheme(id)
            .pipe(mergeMap((isDeleted: boolean) => this.kafkaService.syncDataWithBox(id, 'DELETE', this.entityName, this.managerService.deviceId)));
    }

    public getAll(schemeQueryDto: SchemeQueryDto): Observable<any> {
        return this.schemeRepository.getAll(schemeQueryDto);
    }

    public saveAndCreateScheme(file: any, schemeDto?: SchemeDto): Observable<any> {
        const regex = /sel_\d/g;
        // let array = [... data.toString().matchAll(regex)];
        // let matches = data.toString().search(regex);
        const data = file.buffer.toString();
        const sectorsToSave = data.match(regex) || [];
        const fileName = v1();

        const loadMetadataForTopicsObs = bindCallback(fs.writeFile.bind(fs, fileName + '.svg', file.buffer));
        return loadMetadataForTopicsObs()
            .pipe(mergeMap((result) => {
                if (!schemeDto.schemeId) {
                    schemeDto.schemeId = fileName;
                    schemeDto.file = schemeDto.schemeId;
                }
                (schemeDto as any).sectors = [];
                sectorsToSave.forEach(sectorName => {
                    const sector = new SectorDto();
                    sector.name = sectorName;
                    sector.schemeId = schemeDto.schemeId;
                    sector.sectorId = sectorName + '?' + schemeDto.schemeId;
                    (schemeDto as any).sectors.push(sector);

                });
                return this.schemeRepository.addScheme(schemeDto);
            }
            ));
    }

    public getSvg(schemeId: String): Observable<any> {
        const loadMetadataForTopicsObs = bindCallback(fs.readFile.bind(fs, schemeId + '.svg'));
        return loadMetadataForTopicsObs()
            .pipe(mergeMap((result) => {
                return of({ data: result[1].toString() });
            }));
    }

}
