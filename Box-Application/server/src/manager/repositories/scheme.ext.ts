import { EntityRepository, Repository, DeleteResult, FindManyOptions } from "typeorm";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { SchemeEntity } from "../entities/scheme.entity";
import { Observable, from } from "rxjs";
import { map } from "rxjs/operators";
import { ModuleQueryDto } from "../dto/module.query.dto";
import { plainToClass } from "class-transformer";
import { SchemeQueryDto } from "../dto/scheme.query.dto";

@EntityRepository(SchemeEntity)
export class SchemeExt extends Repository<SchemeEntity> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }

    public updateScheme(data: any): Observable<SchemeEntity> {
        return from(this.save(data)).pipe(
            map((acc: SchemeEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public addScheme(data: any): Observable<SchemeEntity> {
        return from(this.save(data)).pipe(
            map((acc: SchemeEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public deleteScheme(schemeId: string): Observable<boolean> {
        return from(this.delete({ schemeId: schemeId })).pipe(
            map((deleteResult: DeleteResult) => {

                if (!deleteResult) {
                    console.log('Failed to delete');

                    return undefined;
                }

                return true;
            }));
    }

    public getAll(schemeQueryDto: SchemeQueryDto): Observable<Array<SchemeEntity>> {

        const options: FindManyOptions<SchemeEntity> = { where: plainToClass(SchemeEntity, schemeQueryDto) };
        const filter = {};

        for (let [key, value] of Object.entries(schemeQueryDto)) {
            filter[key] = value;
        }

        return from(this.find({ where: filter, relations: ['sectors'] })).pipe(
            map((modules: Array<SchemeEntity>) => {

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

    public getScheme(id?: string): Observable<SchemeEntity> {
        return from(this.findOne({ where: { schemeId: id }, relations: ['sectors'] })).pipe(
            map((scheme: SchemeEntity) => {

                if (!scheme) {
                    console.log('no module found');

                    return undefined;
                }

                // if (!module.transceiver) {
                //     console.log('no transceiver found');

                //     return undefined;
                // }

                return scheme;
            }));
    }
}
