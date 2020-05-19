import { EntityRepository, Repository, DeleteResult, FindManyOptions } from "typeorm";
import { DeviceEntity } from "../../manager/entities/device.entity";
import { ProviderEntity } from "../entities/provider.entity";
import { ISynchronize, ISynchronizeParams } from "../../synchronizer/interfaces/entities.interface";
import { Observable, of, from } from "rxjs";
import { ProvideryDto } from "../dto/provider.dto";
import { ProviderQueryDto } from "../dto/provider.query.dto";
import { plainToClass, classToClass } from "class-transformer";
import { map } from "rxjs/operators";

@EntityRepository(ProviderEntity)
export class ProviderExt extends Repository<ProviderEntity> implements ISynchronize<ProviderEntity | boolean> {

    public synchronize(params: ISynchronizeParams): Observable<ProviderEntity | boolean> {
        //this.updateAccount(data.data).subscribe();
        return of(new ProviderEntity());
    }

    public getDeviceId(id: string): Observable<string> {
        return of('server_1');
    }


    public updateProvider(data: ProvideryDto): Observable<ProviderEntity> {
        return from(this.save(data)).pipe(
            map((acc: ProviderEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public addProvider(data: ProvideryDto): Observable<ProviderEntity> {
        return from(this.save(data)).pipe(
            map((acc: ProviderEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public deleteProvider(id: string): Observable<boolean> {
        return from(this.delete({ providerId: id })).pipe(
            map((deleteResult: DeleteResult) => {

                if (!deleteResult) {
                    console.log('Failed to delete');

                    return undefined;
                }

                return true;
            }));
    }

    public getAll(moduleQueryDto: ProviderQueryDto): Observable<Array<ProviderEntity>> {

        const options: FindManyOptions<ProviderEntity> = { where: plainToClass(ProviderEntity, moduleQueryDto) };
        const filter = {};

        for (let [key, value] of Object.entries(moduleQueryDto)) {
            filter[key] = value;
        }

        return from(this.find({ where: filter, relations: ['user'] })).pipe(
            map((accounts: Array<ProviderEntity>) => {

                if (!accounts) {
                    console.log('no account found');

                    return [];
                }

                if (accounts.length === 0) {
                    console.log('No accounts');

                    return [];
                }

                return accounts;
            }));
    }

    public getProvider(id?: string): Observable<ProviderEntity> {
        return from(this.findOne({ where: { providerId: id }, relations: ['user'] })).pipe(
            map((account: ProviderEntity) => {

                if (!account) {
                    console.log('no module found');

                    return undefined;
                }

                return account;
            }));
    }

}
