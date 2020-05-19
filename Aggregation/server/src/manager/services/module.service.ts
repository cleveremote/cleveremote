import { mergeMap, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { ModuleExt } from '../repositories/module.ext';
import { ModuleDto } from '../dto/module.dto';
import { ModuleQueryDto } from '../dto/module.query.dto';
import { KafkaService } from '../../kafka/services/kafka.service';
import { forwardRef, Inject } from '@nestjs/common';
import { ModuleEntity } from '../entities/module.entity';
import { TYPE_IO, TYPE_MODULE } from '../interfaces/module.interfaces';
import { WebSocketService } from '../../websocket/services/websocket.service';
import { SYNC_ACTION, ELEMENT_TYPE } from '../../websocket/services/interfaces/ws.message.interfaces';
import { ModuleLogMongo, LogMongoEntity } from '../repositories/module-log.mongo';

export class ModuleService {
    public entityName = 'Module';

    constructor(
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @InjectRepository(ModuleExt) private readonly moduleRepository: ModuleExt,
    ) { }

    public get(id: string): Observable<any> {
        return this.moduleRepository.getModule(id)
            .pipe(mergeMap((element) => {
                const module = {} as any;
                module.groupViewId = element.groupViews ? element.groupViews.map((g) => g.id) : [];
                module.transceiverId = [element.transceiverId];
                module.id = element.id;
                module.name = element.name;
                module.type = this.getModuleType(element.port, (element.transceiver.configuration as any).IOCfg);
                module.configuration = { data: "comming soon" };
                module.value = module.type === TYPE_MODULE.RELAY ? 'ON' : '26°';
                return of(module);
            }));
    }

    public add(moduleDto: ModuleDto): Observable<any> {
        return this.moduleRepository.addModule(moduleDto);
        //.pipe(mergeMap((data: ModuleEntity) => this.kafkaService.syncDataWithBox(data, 'ADD', this.entityName, moduleDto.moduleId)));
    }

    public update(moduleDto: ModuleDto): Observable<any> {
        return this.moduleRepository.updateModule(moduleDto)
            .pipe(mergeMap((data: ModuleEntity) => this.kafkaService.syncDataWithBox(data, 'UPDATE', this.entityName, moduleDto.id)));
    }

    public delete(id: string): Observable<any> {
        return this.moduleRepository.deleteModule(id)
            .pipe(mergeMap(() => this.kafkaService.syncDataWithBox(id, 'DELETE', this.entityName, id)));
    }

    public getAll(moduleQueryDto: ModuleQueryDto): Observable<any> {
        return this.moduleRepository.getAll(moduleQueryDto);
    }

    public getAllByDeviceId(deviceId: string): Observable<any> {
        return this.moduleRepository.getAllByDeviceId(deviceId)
            .pipe(mergeMap((result: Array<ModuleEntity>) => {
                const response = [];
                result.forEach(element => {
                    const module = {} as any;
                    module.groupViewId = ['server_1'];
                    module.transceiverId = ['server_1'];
                    module.name = element.name;
                    module.type = this.getModuleType(module.port, (element.transceiver.configuration as any).IOCfg);
                    module.configuration = { data: "comming soon" };
                    module.value = module.type === TYPE_IO.DIGITAL_OUTPUT_HIGH ? 'ON' : 'OFF';
                    response.push(module);
                });
                return of(response);
            }));
    }

    public getModuleType(port: string, transceiverCfg: any): TYPE_MODULE {
        return transceiverCfg[port].params[0] === TYPE_IO.DIGITAL_OUTPUT_LOW || transceiverCfg[port].params[0] === TYPE_IO.DIGITAL_OUTPUT_HIGH ? TYPE_MODULE.RELAY : TYPE_MODULE.SENSOR;
    }

    public getAllByAccountId(accountId: string): Observable<any> {
        return this.moduleRepository.getAllByAccountId(accountId)
            .pipe(mergeMap((result: Array<ModuleEntity>) => {
                const response = [];
                result.forEach(element => {

                    const module = {} as any;

                    module.groupViewId = element.groupViews ? element.groupViews.map((g) => g.id) : [];
                    module.transceiverId = [element.transceiverId];
                    module.id = element.id;
                    module.name = element.name;
                    module.type = this.getModuleType(element.port, (element.transceiver.configuration as any).IOCfg);
                    module.configuration = { data: "comming soon" };
                    module.value = module.type === TYPE_MODULE.RELAY ? 'ON' : '26°';
                    response.push(module);
                });
                return of(response);
            }));
    }

    public execute(moduleDto: ModuleDto, request: any): Observable<LogMongoEntity> {
        WebSocketService.syncClients(SYNC_ACTION.SAVE, ELEMENT_TYPE.VALUE, { valueId: moduleDto.id, value: moduleDto.value }, request);
        const logMongoEntity: LogMongoEntity = {} as LogMongoEntity;
        logMongoEntity.moduleId = moduleDto.id;
        logMongoEntity.value = moduleDto.value;
        logMongoEntity.userId = 'unknowntmp';
        logMongoEntity.source = 'MANUAL';
        logMongoEntity.date = new Date();
        return ModuleLogMongo.createLogs(logMongoEntity);
    }

    public getLastLogs(moduleIds: Array<string>, request: any): Observable<Array<LogMongoEntity>> {
        return ModuleLogMongo.getAllModule(moduleIds);
    }




}
