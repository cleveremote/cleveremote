import { EntityRepository, Repository, DeleteResult, FindManyOptions, In } from "typeorm";
import { SynchronizationEntity } from "../entities/synchronization.entity";
import { ISynchronize, ISynchronizeParams } from "../../synchronizer/interfaces/entities.interface";
import { from, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { classToClass } from "class-transformer";
import { SynchronizationQueryDto } from "../dto/synchronization.dto";

@EntityRepository(SynchronizationEntity)
export class SynchronizationExt extends Repository<SynchronizationEntity> {

    constructor() {
        super();
    }

    public getDeviceId(id: string): Observable<string> {
        return of('server_1');
    }

    public saveSynchronization(data: any): Observable<SynchronizationEntity | Array<SynchronizationEntity>> {
        return from(this.save(data)).pipe(
            map((synchronization: any) => {

                if (!synchronization) {
                    console.log('no account found');

                    return undefined;
                }

                return synchronization;
            }));
    }

    public deleteSynchronization(synchronizationQueryDtos: any): Observable<boolean> {
        const t = classToClass<Array<SynchronizationEntity>>(synchronizationQueryDtos);

        return from(this.remove(t)).pipe(
            map((deleteResult: any) => {

                if (!deleteResult || deleteResult.length === 0) {
                    console.log('Failed to delete');

                    return false;
                }

                return true;
            }));
    }

    public getSynchronization(transceiverQueryDto: SynchronizationQueryDto): Observable<Array<SynchronizationEntity>> {
        const filter = {};

        for (let [key, value] of Object.entries(transceiverQueryDto)) {
            filter[key] = value;
        }

        return from(this.find({ where: filter, relations: ['modules'] })).pipe(
            map((synchronizations: Array<SynchronizationEntity>) => {

                if (synchronizations.length === 0) {
                    console.log('No synchronizations');

                    return [];
                }

                return synchronizations;
            }));
    }

    public getAll(): Observable<Array<SynchronizationEntity>> {

        return from(this.find()).pipe(
            map((synchronizations: Array<SynchronizationEntity>) => {

                if (synchronizations.length === 0) {
                    console.log('No synchronizations');

                    return [];
                }

                return synchronizations;
            }));
    }
}
