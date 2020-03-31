import { EntityRepository, Repository, DeleteResult, FindManyOptions } from "typeorm";
import { Observable, from, of } from "rxjs";
import { DeviceEntity } from "../entities/device.entity";
import { map } from "rxjs/operators";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { TransceiverDto } from "../dto/transceiver.dto";
import { TransceiverQueryDto } from "../dto/transceiver.query.dto";
import { classToClass, plainToClass } from "class-transformer";
import { Inject, forwardRef } from "@nestjs/common";
import { KafkaService } from "../../kafka/services/kafka.service";
import { DeviceDto } from "../dto/device.dto";
import { DeviceQueryDto } from "../dto/device.query.dto";

@EntityRepository(DeviceEntity)
export class DeviceExt extends Repository<DeviceEntity> implements ISynchronize<DeviceEntity | boolean> {

    public synchronize(params: ISynchronizeParams): Observable<DeviceEntity | boolean> {
        //this.updateAccount(data.data).subscribe();
        return of(new DeviceEntity());
    }

    public getDevices(): Observable<Array<DeviceEntity>> {
        return from(this.find({ relations: ['partitionConfigs'] })).pipe(map((devices: Array<DeviceEntity>) => devices
        ));
    }

    public getDeviceInfosBySerial(serialNumber: string): Observable<DeviceEntity> {
        return from(this.findOne({
            where: { device_id: serialNumber },
            relations: ['partitionConfigs', 'account', 'account.users']
        })).pipe(
            map((firstDevice: DeviceEntity) => firstDevice)
        );
    }

    public getDeviceId(id: string): Observable<string> {
        return of('server_1');
    }

    public updateDevice(data: DeviceDto): Observable<DeviceEntity> {
        return from(this.save(data)).pipe(
            map((acc: DeviceEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public addDevice(data: DeviceDto): Observable<DeviceEntity> {
        return from(this.save(data)).pipe(
            map((acc: DeviceEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public deleteDevice(id: string): Observable<boolean> {
        return from(this.delete({ id: id })).pipe(
            map((deleteResult: DeleteResult) => {

                if (!deleteResult) {
                    console.log('Failed to delete');

                    return undefined;
                }

                return true;
            }));
    }

    public getAll(deviceQueryDto: DeviceQueryDto): Observable<Array<DeviceEntity>> {

        const options: FindManyOptions<DeviceEntity> = { where: plainToClass(DeviceEntity, deviceQueryDto) };
        const filter = {};

        for (let [key, value] of Object.entries(deviceQueryDto)) {
            filter[key] = value;
        }

        return from(this.find({
            where: filter,
            relations: [
                'partitionConfigs',
                'account',
                'account.users',
                'transceivers',
                'transceivers.modules',
                'groupViews',
                'groupViews.modules',
                'schemes',
                'schemes.parentscheme',
                'schemes.sectors']
        })).pipe(
            map((accounts: Array<DeviceEntity>) => {

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

    public getDevice(id?: string): Observable<DeviceEntity> {
        return from(this.findOne({ where: { id: id }, relations: ['partitionConfigs', 'account', 'account.users'] })).pipe(
            map((account: DeviceEntity) => {

                if (!account) {
                    console.log('no module found');

                    return undefined;
                }

                return account;
            }));
    }

}
