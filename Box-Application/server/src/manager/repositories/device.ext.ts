import { EntityRepository, Repository } from "typeorm";
import { Observable, from, of } from "rxjs";
import { DeviceEntity } from "../entities/device.entity";
import { map } from "rxjs/operators";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";

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

    public getDevice(): Observable<DeviceEntity> {
        return from(this.findOne({ relations: ['partitionConfigs'] })).pipe(map((firstDevice: DeviceEntity) => firstDevice
        ));
    }
}
