import { EntityRepository, Repository } from "typeorm";
import { TransceiverConfig } from "../entities/transceiver_config";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";

@EntityRepository(TransceiverConfig)
export class TransceiverConfigExt extends Repository<TransceiverConfig> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }
}
