import { EntityRepository, Repository } from "typeorm";
import { users } from "../gen.entities/users";
import * as bcrypt from 'bcrypt-nodejs';
import { Observable, from } from "rxjs";
import { device } from "../gen.entities/device";
import { map } from "rxjs/operators";
import { IDevice } from "../interfaces/entities.interface";

@EntityRepository(device)
export class DeviceExt extends Repository<device> {

    public getDevices(): Observable<Array<device>> {
        return from(this.find({ relations: ['partition_configs'] })).pipe(map((devices: Array<device>) => devices
        ));
    }

    public getDevice(): Observable<device> {
        return from(this.findOne({ relations: ['partition_configs'] })).pipe(map((firstDevice: device) => firstDevice
        ));
    }
}
