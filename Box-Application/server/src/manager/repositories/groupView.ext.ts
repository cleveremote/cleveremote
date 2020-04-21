import { EntityRepository, Repository, DeleteResult, FindManyOptions, getRepository } from "typeorm";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { Observable, from, of } from "rxjs";
import { map } from "rxjs/operators";
import { plainToClass } from "class-transformer";
import { GroupViewEntity } from "../entities/groupView.entity";
import { ModuleEntity } from "../entities/module.entity";

@EntityRepository(GroupViewEntity)
export class GroupViewExt extends Repository<GroupViewEntity> implements ISynchronize<GroupViewEntity | boolean> {

    public synchronize(params: ISynchronizeParams): Observable<GroupViewEntity | boolean> {
        // switch (params.action) {
        //     case 'ADD':
        //         return this.addModule(classToClass<ModuleDto>(params.data));
        //     case 'UPDATE':
        //         return this.updateModule(classToClass<ModuleDto>(params.data));
        //     case 'DELETE':
        //         return this.updateModule(params.data);
        //     default:
        //         break;
        // }
        return of(true);
    }

    public getDeviceId(id: string): Observable<string> {
        return of('server_1');
    }

    // add to a group
    public SaveGroupe(data: any): Observable<GroupViewEntity> {
        return from(this.save(data)).pipe(
            map((acc: GroupViewEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }


    public deleteGroup(id: string): Observable<boolean> {
        return from(this.delete({ id: id })).pipe(
            map((deleteResult: DeleteResult) => {

                if (!deleteResult) {
                    console.log('Failed to delete');

                    return undefined;
                }

                return true;
            }));
    }

    public getAll(moduleQueryDto: any): Observable<Array<GroupViewEntity>> {

        const filter = {};

        for (let [key, value] of Object.entries(moduleQueryDto)) {
            filter[key] = value;
        }

        return from(this.find({ where: filter, relations: ['modules'] })).pipe(
            map((groups: Array<GroupViewEntity>) => {

                if (!groups) {
                    console.log('no group found');

                    return [];
                }

                return groups;
            }));
    }

}
