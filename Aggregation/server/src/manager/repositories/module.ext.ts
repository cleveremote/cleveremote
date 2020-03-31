import { EntityRepository, Repository, DeleteResult, FindManyOptions } from "typeorm";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { ModuleEntity } from "../entities/module.entity";
import { Observable, from, of } from "rxjs";
import { map } from "rxjs/operators";
import { ModuleQueryDto } from "../dto/module.query.dto";
import { plainToClass, classToClass } from "class-transformer";
import { ModuleDto } from "../dto/module.dto";

@EntityRepository(ModuleEntity)
export class ModuleExt extends Repository<ModuleEntity> implements ISynchronize<ModuleEntity | boolean> {

    public synchronize(params: ISynchronizeParams): Observable<ModuleEntity | boolean> {
        switch (params.action) {
            case 'ADD':
                return this.addModule(classToClass<ModuleDto>(params.data));
            case 'UPDATE':
                return this.updateModule(classToClass<ModuleDto>(params.data));
            case 'DELETE':
                return this.updateModule(params.data);
            default:
                break;
        }
    }

    public getDeviceId(id: string): Observable<string> {
        return of('server_1');
    }

    public updateModule(data: ModuleDto): Observable<ModuleEntity> {
        return from(this.save(data)).pipe(
            map((acc: ModuleEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public addModule(data: ModuleDto): Observable<ModuleEntity> {
        return from(this.save(data)).pipe(
            map((acc: ModuleEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public deleteModule(id: string): Observable<boolean> {
        return from(this.delete({ id: id })).pipe(
            map((deleteResult: DeleteResult) => {

                if (!deleteResult) {
                    console.log('Failed to delete');

                    return undefined;
                }

                return true;
            }));
    }

    public getAll(moduleQueryDto: ModuleQueryDto): Observable<Array<ModuleEntity>> {

        const options: FindManyOptions<ModuleEntity> = { where: plainToClass(ModuleEntity, moduleQueryDto) };
        const filter = {};

        for (let [key, value] of Object.entries(moduleQueryDto)) {
            filter[key] = value;
        }

        return from(this.find({ where: filter, relations: ['transceiver'] })).pipe(
            map((modules: Array<ModuleEntity>) => {

                if (!modules) {
                    console.log('no account found');

                    return [];
                }

                if (modules.length === 0) {
                    console.log('No devices');

                    return [];
                }

                return modules;
            }));
    }

    public getAllByDeviceId(deviceId: string): Observable<Array<ModuleEntity>> {

        return from(this.find({
            where: qb => {
                qb.where('transceiver.deviceId = :deviceId', { deviceId: deviceId }); // Filter related field
            },
            join: { alias: 'module', innerJoin: { transceiver: 'module.transceiver' } },
            relations: ['transceiver']
        })).pipe(
            map((modules: Array<ModuleEntity>) => {

                if (!modules) {
                    console.log('no account found');

                    return [];
                }

                if (modules.length === 0) {
                    console.log('No devices');

                    return [];
                }

                return modules;
            }));
    }

    public getAllByAccountId(accountId: string): Observable<Array<ModuleEntity>> {

        return from(this.find({
            where: qb => {
                qb.where('transceiver.deviceId = device.id')
                    .andWhere('device.accountId=:accountId', { accountId: accountId }); // Filter related field
            },
            join: { alias: 'module', innerJoin: { transceiver: 'module.transceiver', device: 'transceiver.device' } },
            relations: ['transceiver']
        })).pipe(
            map((modules: Array<ModuleEntity>) => {

                if (!modules) {
                    console.log('no account found');

                    return [];
                }

                if (modules.length === 0) {
                    console.log('No devices');

                    return [];
                }

                return modules;
            }));
    }



    public getModule(id?: string): Observable<ModuleEntity> {
        return from(this.findOne({ where: { id: id }, relations: ['transceiver', 'groupviews'] })).pipe(
            map((module: ModuleEntity) => {

                if (!module) {
                    console.log('no module found');

                    return undefined;
                }

                if (!module.transceiver) {
                    console.log('no transceiver found');

                    return undefined;
                }

                return module;
            }));
    }
}
