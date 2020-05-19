import { DeviceExt } from "../repositories/device.ext";
import { InjectRepository } from "@nestjs/typeorm";
import { Observable, of } from "rxjs";
import { PartitionConfigEntity } from "../entities/partitionconfig.entity";
import { DeviceEntity } from "../entities/device.entity";
import { map, tap, catchError } from "rxjs/operators";
import { Tools, boxInfo } from "../../common/tools-service";

export class ManagerService {
    public deviceId: string;
    constructor(
        @InjectRepository(DeviceExt) private readonly deviceRepository: DeviceExt) { }

    public getPartitionconfig(): Observable<PartitionConfigEntity | boolean> {
        const progressBar = Tools.startProgress('load device configuration      ', 0, 1);
        return this.deviceRepository.getDevice()
            .pipe(map((currentDevice: DeviceEntity) => {
                this.deviceId = currentDevice.id;
                boxInfo.id = this.deviceId;
                return currentDevice && currentDevice.partitionConfigs && currentDevice.partitionConfigs.length > 0 ? currentDevice.partitionConfigs[0] : undefined
            }))
            .pipe(tap(() => progressBar.increment()))
            .pipe(tap(() => Tools.stopProgress('load device configuration      ', progressBar)))
            .pipe(
                catchError(error => {
                    Tools.stopProgress('load device configuration      ', progressBar, error);
                    return of(false);
                })
            );
    }
}
