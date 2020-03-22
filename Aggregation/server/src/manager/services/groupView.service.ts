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
import { KafkaService } from '../../kafka/services/kafka.service';
import { forwardRef, Inject } from '@nestjs/common';
import { ModuleEntity } from '../entities/module.entity';
import { GroupViewExt } from '../repositories/groupView.ext';
import { AssGroupViewModuleExt } from '../repositories/assGroupViewModule.ext';
import { AssGroupViewModuleEntity } from '../entities/assGroupViewModule.entity';
import { TYPE_MODULE, TYPE_IO } from '../interfaces/module.interfaces';
import { v1 } from 'uuid';

export class GroupViewService {
    public entityName = 'GroupView';

    constructor(
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @InjectRepository(AssGroupViewModuleExt) private readonly assGroupViewRepository: AssGroupViewModuleExt,
        @InjectRepository(AssGroupViewModuleExt) private readonly groupViewRepository: GroupViewExt
    ) { }

    public saveGroup(moduleDto: any): Observable<any> {
        moduleDto.forEach(element => {
            if (!element.assId) {
                element.assId = v1();
            }
        });
        return this.assGroupViewRepository.SaveGroupe(moduleDto);
        // .pipe(mergeMap((data: ModuleEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, moduleDto.moduleId)));
    }

    public addGroup(moduleDto: any): Observable<any> {

        return this.groupViewRepository.SaveGroupe(moduleDto);
        // .pipe(mergeMap((data: ModuleEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, moduleDto.moduleId)));
    }

    public delete(groupId: string, moduleId: string): Observable<any> {
        return this.assGroupViewRepository.deleteModuleFromGroup(groupId, moduleId);
        // .pipe(mergeMap((isDeleted: boolean) => this.kafkaService.syncDataWithBox(id, 'DELETE', this.entityName, id)));
    }
    public getModuleType(port: string, transceiverCfg: any): TYPE_MODULE {
        return transceiverCfg[port] === TYPE_IO.DIGITAL_OUTPUT_HIGH || TYPE_IO.DIGITAL_OUTPUT_LOW ? TYPE_MODULE.RELAY : TYPE_MODULE.SENSOR;
    }

    public getAll(moduleQueryDto: any): Observable<any> {
        return this.assGroupViewRepository.getAll(moduleQueryDto)
            .pipe(mergeMap((result: Array<AssGroupViewModuleEntity>) => {
                const response = {} as any;
                response.group = result[0].group;
                response.modules = [];
                result.forEach(element => {
                    const module = {} as any;
                    module.name = element.module.name;
                    module.type = this.getModuleType(module.port, (element.module.transceiver.configuration as any).IOCfg);
                    module.configuration = { data: "comming soon" };
                    module.value = (module as any).type === TYPE_IO.DIGITAL_OUTPUT_HIGH ? 'ON' : 'OFF';
                    response.modules.push(module);
                });
                return of(response);
            }));
    }
}
