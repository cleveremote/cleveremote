import { getCustomRepository, getRepository } from "typeorm";
import { DeviceExt } from "../manager/repositories/device.ext";
import { TransceiverExt } from "../manager/repositories/transceiver.ext";
import { PartitionConfigExt } from "../manager/repositories/partitionConfig.ext";
import { ISynchronize, ISynchronizeParams } from "../synchronizer/interfaces/entities.interface";
import { ModuleExt } from "../manager/repositories/module.ext";
import { SchemeExt } from "../manager/repositories/scheme.ext";
import { SectorExt } from "../manager/repositories/sector.ext";
import { Observable } from "rxjs";
import { AccountExt } from "../authentication/repositories/account.ext";
import { UserExt } from "../authentication/repositories/user.ext";
import { ProviderExt } from "../authentication/repositories/provider.ext";

import { AccountService } from "../authentication/services/account.service";
import { DeviceService } from "../manager/services/device.service";
import { UserService } from "../authentication/services/user.service";
import { ModuleService } from "../manager/services/module.service";
import { ProviderService } from "../authentication/services/provider.service";
import { SchemeService } from "../manager/services/scheme.service";
import { SectorService } from "../manager/services/sector.service";
import { TransceiverService } from "../manager/services/transceiver.service";

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

    public classServiceStore = [
        AccountService,
        UserService,
        DeviceService,
        ModuleService,
        ProviderService,
        SchemeService,
        SectorService,
        TransceiverService
    ];

    public dynamicType(entityName: string): any {
        const className = `${entityName}Ext`;
        const t = this.classStore.find((test: any) => test.name === className);
        if (!t) {
            throw new Error(`Class type of \'${entityName}\' is not in the store`);
        }

        return t;
    }



    public dataBaseSynchronize(data: ISynchronizeParams): Observable<any> {
        const type = this.dynamicType(data.entity);
        const repository = getCustomRepository(type);
        return (repository as ISynchronize<typeof type>).synchronize(data);
    }

}
