import { EntityRepository, Repository } from "typeorm";
import { PartitionConfigEntity } from "../entities/partitionconfig.entity";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { of, Observable } from "rxjs";

@EntityRepository(PartitionConfigEntity)
export class PartitionConfigExt extends Repository<PartitionConfigEntity> implements ISynchronize<PartitionConfigEntity | boolean> {

    public synchronize(params: ISynchronizeParams): Observable<PartitionConfigEntity | boolean> {
        //this.updateAccount(data.data).subscribe();
        return of(new PartitionConfigEntity());
    }

}
