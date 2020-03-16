import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../repositories/account.ext";
import { UserExt } from "../repositories/user.ext";
import { DeviceExt } from "../repositories/device.ext";
import { TransceiverExt } from "../repositories/transceiver.ext";
import { PartitionConfigExt } from "../repositories/partitionConfig.ext";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { ModuleExt } from "../repositories/module.ext";
import { ProviderExt } from "../repositories/provider.ext";
import { SchemeExt } from "../repositories/scheme.ext";
import { SectorExt } from "../repositories/sector.ext";
import { Observable } from "rxjs";

export class MapperService {
    public classStore = [
        AccountExt,
        UserExt,
        DeviceExt,
        PartitionConfigExt,
        ModuleExt,
        ProviderExt,
        SchemeExt,
        SectorExt,
        TransceiverExt
    ];

    public dynamicType(entityName: string): any {
        const className = `${entityName}Ext`;
        const t = this.classStore.find((test: any) => test.name === className);
        if (!t) {
            throw new Error(`Class type of \'${entityName}\' is not in the store`);
        }

        return t;
    }

    public dataBaseSynchronize(message: string): Observable<any> {
        const data: ISynchronizeParams = JSON.parse(message);
        const type = this.dynamicType(data.entity);
        const repository = getCustomRepository(type);
        return (repository as ISynchronize<typeof type>).synchronize(data);
    }

}
