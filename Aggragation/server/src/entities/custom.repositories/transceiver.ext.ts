import { EntityRepository, Repository } from "typeorm";
import { Transceiver } from "../gen.entities/transceiver";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";

@EntityRepository(Transceiver)
export class TransceiverExt extends Repository<Transceiver> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }
}
