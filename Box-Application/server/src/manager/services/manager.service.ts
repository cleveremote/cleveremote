import { DeviceExt } from "../repositories/device.ext";
import { InjectRepository } from "@nestjs/typeorm";
import { Observable } from "rxjs";
import { PartitionConfigEntity } from "../entities/partitionconfig.entity";
import { DeviceEntity } from "../entities/device.entity";
import { map } from "rxjs/operators";

export class ManagerService {
    constructor(
        @InjectRepository(DeviceExt) private deviceRepository: DeviceExt) { }

    public getPartitionconfig(): Observable<PartitionConfigEntity> {
        return this.deviceRepository.getDevice().pipe(
            map((currentDevice: DeviceEntity) =>
                currentDevice && currentDevice.partitionConfigs && currentDevice.partitionConfigs.length > 0 ? currentDevice.partitionConfigs[0] : undefined));
    }
}
