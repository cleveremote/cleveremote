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
import { GroupViewEntity } from '../entities/groupView.entity';
import { getRepository } from 'typeorm';

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
        return this.schemeRepository.addScheme(schemeDto);
        // .pipe(mergeMap((data: SchemeEntity) => this.kafkaService.syncDataWithBox(data, 'ADD', this.entityName, this.managerService.deviceId)));
    }

    public update(schemeDto: SchemeDto): Observable<any> {
        return this.schemeRepository.updateScheme(schemeDto);
        //.pipe(mergeMap((data: SchemeEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, this.managerService.deviceId)));
    }

    public delete(id: string): Observable<any> {
        return this.schemeRepository.deleteScheme(id);
        //.pipe(mergeMap((isDeleted: boolean) => this.kafkaService.syncDataWithBox(id, 'DELETE', this.entityName, this.managerService.deviceId)));
    }

    public getAll(schemeQueryDto: SchemeQueryDto): Observable<any> {
        return this.schemeRepository.getAll(schemeQueryDto);
    }


    public saveAndCreateScheme(file: any, schemeDto?: SchemeDto): Observable<any> {
        const regex = /sel_\d/g;
        // let array = [... data.toString().matchAll(regex)];
        // let matches = data.toString().search(regex);
        let data = file.buffer.toString();
        const svgSectors = data.match(regex) || [];

        const sectorsId = [];
        svgSectors.forEach(svgSector => {
            const sectorId = v1();
            const nameToFind = svgSector.replace('sel_', 'selname_');
            data = data.replace(svgSector, sectorId);
            data = data.replace(nameToFind, 'selname_'+sectorId);
            sectorsId.push(sectorId);
        });

        const fileName = v1();
        const groupViewsToSave = [];
        const loadMetadataForTopicsObs = bindCallback(fs.writeFile.bind(fs, fileName + '.svg', data));
        return loadMetadataForTopicsObs()
            .pipe(mergeMap((result) => {
                if (!schemeDto.id) {
                    schemeDto.id = fileName;
                    schemeDto.file = schemeDto.id;
                }
                (schemeDto as any).sectors = [];
                sectorsId.forEach((sectorId, index) => {
                    const sector = new SectorEntity();
                    sector.name = 'sector_tmp_' + index;
                    sector.schemeId = schemeDto.id;
                    sector.id = sectorId;
                    const group = new GroupViewEntity();
                    group.id = v1();
                    group.name = 'grouView_name_tmp_' + v1();
                    group.description = 'description_tmp';
                    group.sectorId = sectorId;
                    group.sectors = [];
                    group.sectors.push(sector);
                    groupViewsToSave.push(group);
                    (schemeDto as any).sectors.push(sector);


                });
                return this.schemeRepository.addScheme(schemeDto)
                    .pipe(map((scheme) => {
                        const repo = getRepository(GroupViewEntity);
                        return repo.save(groupViewsToSave);
                    }));
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
