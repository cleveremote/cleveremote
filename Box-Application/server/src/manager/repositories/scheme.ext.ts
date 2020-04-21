import { EntityRepository, Repository, DeleteResult, FindManyOptions } from "typeorm";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { SchemeEntity } from "../entities/scheme.entity";
import { Observable, from, of } from "rxjs";
import { map } from "rxjs/operators";
import { plainToClass, classToClass } from "class-transformer";
import { SchemeQueryDto } from "../dto/scheme.query.dto";
import { SchemeDto } from "../dto/scheme.dto";

@EntityRepository(SchemeEntity)
export class SchemeExt extends Repository<SchemeEntity> implements ISynchronize<SchemeEntity | boolean> {

    public synchronize(params: ISynchronizeParams): Observable<SchemeEntity | boolean> {
        switch (params.action) {
            case 'ADD':
                return this.addScheme(classToClass<SchemeDto>(params.data));
            case 'UPDATE':
                return this.updateScheme(classToClass<SchemeDto>(params.data));
            case 'DELETE':
                return this.deleteScheme(params.data);
            default:
                break;
        }
    }

    public getDeviceId(id: string): Observable<string> {
        return of('server_1');
    }

    public updateScheme(data: SchemeDto): Observable<SchemeEntity> {
        return from(this.save(data)).pipe(
            map((acc: SchemeEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public addScheme(data: SchemeDto): Observable<SchemeEntity> {
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
        return from(this.delete({ id: schemeId })).pipe(
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
        return from(this.findOne({ where: { id: id }, relations: ['sectors'] })).pipe(
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
