import { EntityRepository, Repository } from "typeorm";
import { DeviceEntity } from "../../kafka/entities/device.entity";
import { ProviderEntity } from "../gen.entities/provider.entity";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";

@EntityRepository(DeviceEntity)
export class ProviderExt extends Repository<ProviderEntity> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }

}
