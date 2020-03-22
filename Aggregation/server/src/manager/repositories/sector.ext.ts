import { EntityRepository, Repository, DeleteResult, FindManyOptions } from "typeorm";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { SchemeEntity } from "../entities/scheme.entity";
import { Observable, from, of } from "rxjs";
import { map } from "rxjs/operators";
import { ModuleQueryDto } from "../dto/module.query.dto";
import { plainToClass, classToClass } from "class-transformer";
import { SchemeQueryDto } from "../dto/scheme.query.dto";
import { SectorEntity } from "../entities/sector.entity";
import { SectorQueryDto } from "../dto/sector.query.dto";
import { SectorDto } from "../dto/sector.dto";

@EntityRepository(SectorEntity)
export class SectorExt extends Repository<SectorEntity> implements ISynchronize<SectorEntity | boolean> {

    public synchronize(params: ISynchronizeParams): Observable<SectorEntity | boolean> {
        switch (params.action) {
            case 'ADD':
                return this.addSector(classToClass<SectorDto>(params.data));
            case 'UPDATE':
                return this.updateSector(classToClass<SectorDto>(params.data));
            case 'DELETE':
                return this.deleteSector(params.data);
            default:
                break;
        }
    }

    public getDeviceId(id: string): Observable<string> {
        return of('server_1');
    }

    public updateSector(data: SectorDto): Observable<SectorEntity> {
        return from(this.save(data)).pipe(
            map((acc: SectorEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public addSector(data: SectorDto): Observable<SectorEntity> {
        return from(this.save(data)).pipe(
            map((acc: SectorEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public deleteSector(sectorId: string): Observable<boolean> {
        return from(this.delete({ sectorId: sectorId })).pipe(
            map((deleteResult: DeleteResult) => {

                if (!deleteResult) {
                    console.log('Failed to delete');

                    return undefined;
                }

                return true;
            }));
    }

    public getAll(sectorQueryDto: SectorQueryDto): Observable<Array<SectorEntity>> {

        const options: FindManyOptions<SectorEntity> = { where: plainToClass(SchemeEntity, sectorQueryDto) };
        const filter = {};

        for (let [key, value] of Object.entries(sectorQueryDto)) {
            filter[key] = value;
        }

        return from(this.find({ where: filter, relations: ['modules'] })).pipe(
            map((modules: Array<SectorEntity>) => {

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

    public getSector(id?: string): Observable<SectorEntity> {
        return from(this.findOne({ where: { sectorId: id }, relations: ['modules'] })).pipe(
            map((sector: SectorEntity) => {

                if (!sector) {
                    console.log('no module found');

                    return undefined;
                }

                // if (!module.transceiver) {
                //     console.log('no transceiver found');

                //     return undefined;
                // }

                return sector;
            }));
    }
}
