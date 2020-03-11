import { EntityRepository, Repository, DeleteResult, FindManyOptions } from "typeorm";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { ModuleEntity } from "../entities/module.entity";
import { Observable, from } from "rxjs";
import { map } from "rxjs/operators";
import { ModuleQueryDto } from "../dto/module.query.dto";
import { plainToClass } from "class-transformer";

@EntityRepository(ModuleEntity)
export class ModuleExt extends Repository<ModuleEntity> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }

    public updateModule(data: any): Observable<ModuleEntity> {
        return from(this.save(data)).pipe(
            map((acc: ModuleEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public addModule(data: any): Observable<ModuleEntity> {
        return from(this.save(data)).pipe(
            map((acc: ModuleEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public deleteModule(moduleId1: string): Observable<boolean> {
        return from(this.delete({ moduleId: moduleId1 })).pipe(
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

    public getModule(id?: string): Observable<ModuleEntity> {
        return from(this.findOne({ where: { moduleId: id }, relations: ['transceiver'] })).pipe(
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
