import { EntityRepository, Repository } from "typeorm";
import { PartitionConfigEntity } from "../entities/partitionconfig.entity";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";

@EntityRepository(PartitionConfigEntity)
export class PartitionConfigExt extends Repository<PartitionConfigEntity> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }

}
