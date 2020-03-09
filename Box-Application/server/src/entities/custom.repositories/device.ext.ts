import { EntityRepository, Repository } from "typeorm";
import { Observable, from } from "rxjs";
import { DeviceEntity } from "../../kafka/entities/device.entity";
import { map } from "rxjs/operators";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";

@EntityRepository(DeviceEntity)
export class DeviceExt extends Repository<DeviceEntity> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }

    public getDevices(): Observable<Array<DeviceEntity>> {
        return from(this.find({ relations: ['partition_configs'] })).pipe(map((devices: Array<DeviceEntity>) => devices
        ));
    }

    public getDeviceInfosBySerial(serialNumber: string): Observable<DeviceEntity> {
        return from(this.findOne({
            where: { device_id: serialNumber },
            relations: ['partition_configs', 'account', 'account.users']
        })).pipe(
            map((firstDevice: DeviceEntity) => firstDevice)
        );
    }

    public getDevice(): Observable<DeviceEntity> {
        return from(this.findOne({ relations: ['partition_configs'] })).pipe(map((firstDevice: DeviceEntity) => firstDevice
        ));
    }
}
