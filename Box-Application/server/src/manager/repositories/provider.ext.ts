import { EntityRepository, Repository } from "typeorm";
import { DeviceEntity } from "../entities/device.entity";
import { ProviderEntity } from "../entities/provider.entity";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { of, Observable } from "rxjs";

@EntityRepository(DeviceEntity)
export class ProviderExt extends Repository<ProviderEntity> implements ISynchronize<ProviderEntity | boolean> {

    public synchronize(params: ISynchronizeParams): Observable<ProviderEntity | boolean> {
        //this.updateAccount(data.data).subscribe();
        return of(new ProviderEntity());
    }

}
