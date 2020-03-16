import { EntityRepository, Repository } from "typeorm";
import { Device } from "../entities/device";
import { Provider } from "../entities/provider";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";

@EntityRepository(Device)
export class ProviderExt extends Repository<Provider> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }

}
