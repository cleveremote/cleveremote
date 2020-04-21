import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap, mergeMap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, from, pipe, GroupedObservable } from 'rxjs';
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
import { GroupViewExt } from '../repositories/groupView.ext';
import { TYPE_MODULE, TYPE_IO } from '../interfaces/module.interfaces';
import { v1 } from 'uuid';
import { WebSocketService } from '../../websocket/services/websocket.service';
import { ModuleService } from './module.service';
import { ELEMENT_TYPE, ACTION_TYPE } from '../../websocket/services/interfaces/ws.message.interfaces';
import { GroupViewEntity } from '../entities/groupView.entity';
import { getRepository, In } from 'typeorm';

export class GroupViewService {
    public entityName = 'GroupView';

    constructor(
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @Inject(forwardRef(() => ModuleService)) private readonly moduleService: ModuleService,
        @InjectRepository(GroupViewExt) private readonly groupViewRepository: GroupViewExt
    ) { }

    public saveToGroup(modules: Array<string>, groupId: string, request: any): Observable<any> {
        return from(getRepository(GroupViewEntity)
            .findOne({ where: { id: groupId }, relations: ["modules"] }))
            .pipe(mergeMap(groupe => {
                groupe.modules = groupe.modules.concat([...modules].map(x => ({ id: x }) as any));
                return this.groupViewRepository.SaveGroupe(groupe)
                    .pipe(map((groupView: GroupViewEntity) => {
                        WebSocketService.syncClients(ACTION_TYPE.ADD, ELEMENT_TYPE.GROUPVIEW, groupView, request);
                        
                        return groupView;
                    }));
            }));
    }

    public removeFromGroup(modules: Array<string>, groupId: string, request: any): Observable<any> {
        return from(getRepository(GroupViewEntity)
            .findOne({ where: { id: groupId }, relations: ["modules"] }))
            .pipe(mergeMap(groupe => {
                groupe.modules = groupe.modules.filter((module: ModuleEntity) => [...modules].indexOf(module.id) === -1);
                return this.groupViewRepository.SaveGroupe(groupe)
                    .pipe(map((groupView: GroupViewEntity) => {
                        WebSocketService.syncClients(ACTION_TYPE.ADD, ELEMENT_TYPE.GROUPVIEW, groupView, request);
                        return groupView;
                    }));
            }));
    }

    public addGroup(moduleDto: any): Observable<any> {
        return this.groupViewRepository.SaveGroupe(moduleDto);
        // .pipe(mergeMap((data: ModuleEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, moduleDto.moduleId)));
    }

    public delete(modules: Array<string>, groupId: string): Observable<any> {
        const assGroupViews = [];
        modules.forEach(moduleId => {
            assGroupViews.push({ moduleId: moduleId, groupId: groupId });
        });
        // return this.assGroupViewRepository.deleteModuleFromGroup(assGroupViews[0].groupId, assGroupViews[0].moduleId);
        // .pipe(mergeMap((isDeleted: boolean) => this.kafkaService.syncDataWithBox(id, 'DELETE', this.entityName, id)));
        return of(true);
    }

    public getModuleType(port: string, transceiverCfg: any): TYPE_MODULE {
        return transceiverCfg[port] === TYPE_IO.DIGITAL_OUTPUT_HIGH || TYPE_IO.DIGITAL_OUTPUT_LOW ? TYPE_MODULE.RELAY : TYPE_MODULE.SENSOR;
    }

    public getAll(groupViewQueryDto: any): Observable<any> {
        return this.groupViewRepository.getAll(groupViewQueryDto)
            .pipe(mergeMap((result: Array<any>) => of(result)));
    }
}

 // public saveGroup(modules: Array<string>, groupId: string, request: any): Observable<any> {
    //     const assGroupViews = [];
    //     const group = {} as any;
    //     group.id = groupId;
    //     group.modules = [...modules];

    //     return this.groupViewRepository.SaveGroupe(group)
    //         .pipe(mergeMap(result => {
    //             // return this.moduleService.get(result[0].id)
    //             //     .pipe(mergeMap((module) => {
    //             //         const messageToBuild = {
    //             //             typeAction: ACTION_TYPE.ADD,
    //             //             target: ELEMENT_TYPE.MODULE,
    //             //             date: new Date(),
    //             //             data: [module] // aouter transceiverId + groupView
    //             //         };
    //             //         const message = JSON.stringify(messageToBuild);
    //             //         WebSocketService.sendMessage('', message, [request.headers["authorization"].split(" ")[1]]);
    //             //         return of(result);
    //             //     }))
    //             return of(result)
    //         }

    //         ));

    //     // .pipe(mergeMap((data: ModuleEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, moduleDto.moduleId)));
    // }

    // public saveGroup(modules: Array<string>, groupId: string, request: any): Observable<any> {
    //     const assGroupViews = [];
    //     return from(getRepository(GroupViewEntity)
    //         .findOne({ where: { id: groupId }, relations: ["modules"] }))
    //         .pipe(mergeMap(groupe =>
    //             from(getRepository(ModuleEntity).find({ where: { id: In([...modules]) } }))
    //                 .pipe(mergeMap((moduleEntities: Array<ModuleEntity>) => {
    //                     groupe.modules = groupe.modules.concat(moduleEntities);
    //                     return this.groupViewRepository.SaveGroupe(groupe)
    //                         .pipe(map(result => result));
    //                 }))
    //         ));

    //     // .pipe(mergeMap((data: ModuleEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, moduleDto.moduleId)));
    // }
