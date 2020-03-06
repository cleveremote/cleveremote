import { EntityRepository, Repository } from "typeorm";
import { Observable, from } from "rxjs";
import { Device } from "../gen.entities/device";
import { map } from "rxjs/operators";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";

@EntityRepository(Device)
export class DeviceExt extends Repository<Device> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }

    public getDevices(): Observable<Array<Device>> {
        return from(this.find({ relations: ['partition_configs'] })).pipe(map((devices: Array<Device>) => devices
        ));
    }

    public getDeviceInfosBySerial(serialNumber: string): Observable<Device> {
        return from(this.findOne({
            where: { device_id: serialNumber },
            relations: ['partition_configs', 'account', 'account.users']
        })).pipe(
            map((firstDevice: Device) => firstDevice)
        );
    }

    public getDevice(): Observable<Device> {
        return from(this.findOne({ relations: ['partition_configs'] })).pipe(map((firstDevice: Device) => firstDevice
        ));
    }
}
