import { EntityRepository, Repository } from "typeorm";
import { PartitionConfig } from "../entities/partition_config";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";

@EntityRepository(PartitionConfig)
export class PartitionConfigExt extends Repository<PartitionConfig> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }

}
