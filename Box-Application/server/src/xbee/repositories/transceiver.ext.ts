import { EntityRepository, Repository, DeleteResult } from "typeorm";
import { TransceiverEntity } from "../entities/transceiver.entity";
import { ISynchronize, ISynchronizeParams } from "../../entities/interfaces/entities.interface";
import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { TransceiverDto } from "../dto/transceiver.dto";

@EntityRepository(TransceiverEntity)
export class TransceiverExt extends Repository<TransceiverEntity> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }

    public updateTransceiver(id: string, data: any): Observable<TransceiverEntity> {
        return from(this.save(data)).pipe(
            map((transceiver: TransceiverEntity) => {

                if (!transceiver) {
                    console.log('no account found');

                    return undefined;
                }

                return transceiver;
            }));
    }

    public addTransceiver(data: TransceiverDto): Observable<TransceiverEntity> {
        return from(this.save(data)).pipe(
            map((transceiver: TransceiverEntity) => {

                if (!transceiver) {
                    console.log('no account found');

                    return undefined;
                }

                return transceiver;
            }));
    }

    public deleteTransceiver(id: string): Observable<boolean> {
        return from(this.delete(id)).pipe(
            map((deleteResult: DeleteResult) => {

                if (!deleteResult) {
                    console.log('Failed to delete');

                    return undefined;
                }

                return true;
            }));
    }

    public getAll(): Observable<Array<TransceiverEntity>> {
        return from(this.find({ relations: ['transceiver'] })).pipe(
            map((transceivers: Array<TransceiverEntity>) => {

                if (transceivers.length === 0) {
                    console.log('No transceivers');

                    return [];
                }

                return transceivers;
            }));
    }

    public getTransceiver(id?: string): Observable<TransceiverEntity> {
        return from(this.findOne({ where: { id: id }, relations: ['module'] })).pipe(
            map((transceiver: TransceiverEntity) => {

                if (!transceiver) {
                    console.log('no module found');

                    return undefined;
                }

                return transceiver;
            }));
    }
}
