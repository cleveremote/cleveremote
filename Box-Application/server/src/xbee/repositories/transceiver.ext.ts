import { EntityRepository, Repository } from "typeorm";
import { Transceiver } from "../entities/transceiver";
import { ISynchronize, ISynchronizeParams } from "../../entities/interfaces/entities.interface";

@EntityRepository(Transceiver)
export class TransceiverExt extends Repository<Transceiver> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }
}
