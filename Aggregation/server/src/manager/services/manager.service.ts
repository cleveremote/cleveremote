import { DeviceExt } from "../repositories/device.ext";
import { InjectRepository } from "@nestjs/typeorm";
import { Observable, of } from "rxjs";
import { DeviceEntity } from "../entities/device.entity";
import { map, tap, catchError, mergeMap } from "rxjs/operators";
import { Tools } from "../../common/tools-service";
import { IPartitionConfig } from "../../kafka/interfaces/partition.config.interface";

export class ManagerService {
    constructor(
        @InjectRepository(DeviceExt) private readonly deviceRepository: DeviceExt) { }

    public getDevicesPartitionConfig(): Observable<Array<IPartitionConfig> | boolean> {
        const progressBar = Tools.startProgress('load devices configuration      ', 0, 1);
        return this.deviceRepository.getDevices()
            .pipe(mergeMap((currentDevices: Array<DeviceEntity>) => {
                const devicesConfig: Array<IPartitionConfig> = [];
                currentDevices.forEach(device => {
                    if (device.partitionConfigs && device.partitionConfigs.length > 0) {
                        const cfg: IPartitionConfig = { deviceId: device.deviceId, startRange: device.partitionConfigs[0].startRange, endRange: device.partitionConfigs[0].endRange };
                        devicesConfig.push(cfg);
                    }
                });
                return of(devicesConfig);
            }))
            .pipe(tap(() => progressBar.increment()))
            .pipe(tap(() => Tools.stopProgress('load devices configuration      ', progressBar)))
            .pipe(
                catchError(error => {
                    Tools.stopProgress('load devices configuration      ', progressBar, error);
                    return of(false);
                })
            );
    }
}
