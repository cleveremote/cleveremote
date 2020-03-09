import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../entities/custom.repositories/account.ext";
import { UserExt } from "../entities/custom.repositories/user.ext";
import { DeviceExt } from "../entities/custom.repositories/device.ext";
import { TransceiverExt } from "../xbee/repositories/transceiver.ext";
import { PartitionConfigExt } from "../entities/custom.repositories/partitionConfig.ext";
import { ISynchronize, ISynchronizeParams } from "../entities/interfaces/entities.interface";

export class MapperService {
    public classStore = [
        AccountExt,
        UserExt,
        TransceiverExt,
        DeviceExt,
        PartitionConfigExt
    ];

    public dynamicType(entityName: string): any {
        const className = `${entityName}Ext`;
        const t = this.classStore.find((test: any) => test.name === className);
        if (!t) {
            throw new Error(`Class type of \'${entityName}\' is not in the store`);
        }

        return t;
    }

    public dataBaseSynchronize(message: string): void {
        const data: ISynchronizeParams = JSON.parse(message);
        const type = this.dynamicType(data.entity);
        const repository = getCustomRepository(type);
        (repository as ISynchronize).synchronize(data);
    }

}
