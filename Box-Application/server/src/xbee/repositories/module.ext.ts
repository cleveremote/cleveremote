import { EntityRepository, Repository, DeleteResult } from "typeorm";
import { ISynchronize, ISynchronizeParams } from "../../entities/interfaces/entities.interface";
import { ModuleEntity } from "../entities/module.entity";
import { Observable, from } from "rxjs";
import { map } from "rxjs/operators";

@EntityRepository(ModuleEntity)
export class ModuleExt extends Repository<ModuleEntity> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }

    public updateModule(id: string, data: any): Observable<ModuleEntity> {
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

    public deleteModule(id: string): Observable<boolean> {
        return from(this.delete(id)).pipe(
            map((deleteResult: DeleteResult) => {

                if (!deleteResult) {
                    console.log('Failed to delete');

                    return undefined;
                }

                return true;
            }));
    }

    public getAll(): Observable<Array<ModuleEntity>> {
        return from(this.find({ relations: ['transceiver'] })).pipe(
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
        return from(this.findOne({ where: { id: id }, relations: ['transceiver'] })).pipe(
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
