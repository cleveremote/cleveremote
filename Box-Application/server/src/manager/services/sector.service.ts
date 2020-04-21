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
import { SectorExt } from '../repositories/sector.ext';
import { SectorQueryDto } from '../dto/sector.query.dto';
import { SectorDto } from '../dto/sector.dto';
import { KafkaService } from '../../kafka/services/kafka.service';
import { forwardRef, Inject } from '@nestjs/common';
import { SectorEntity } from '../entities/sector.entity';
import { ACTION_TYPE, ELEMENT_TYPE } from '../../websocket/services/interfaces/ws.message.interfaces';
import { WebSocketService } from '../../websocket/services/websocket.service';

export class SectorService {
    public entityName = 'Sector';

    constructor(
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @InjectRepository(SectorExt) private readonly sectorRepository: SectorExt,
    ) { }

    public get(id: string): Observable<any> {
        return this.sectorRepository.getSector(id);
    }

    public add(sectorDto: SectorDto): Observable<any> {
        return this.sectorRepository.addSector(sectorDto)
            .pipe(mergeMap((data: SectorEntity) => this.kafkaService.executeDbSync(data, 'ADD', this.entityName, sectorDto.id)));
    }

    public update(sectorDto: SectorDto, request: any): Observable<any> {
        return this.sectorRepository.updateSector(sectorDto)
            .pipe(mergeMap(sector => this.get(sector.id)))
            .pipe(map((sectorEntity: SectorEntity) => {
                WebSocketService.syncClients(ACTION_TYPE.UPDATE, ELEMENT_TYPE.SECTOR, sectorEntity, request);
                return sectorEntity;
            }));
        //.pipe(mergeMap((data: SectorEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, sectorDto.id)));
    }

    public delete(id: string): Observable<any> {
        return this.sectorRepository.deleteSector(id)
            .pipe(mergeMap((isDeleted: boolean) => this.kafkaService.executeDbSync(id, 'DELETE', this.entityName, id)));
    }

    public getAll(sectorQueryDto: SectorQueryDto): Observable<any> {
        return this.sectorRepository.getAll(sectorQueryDto);
    }
}
