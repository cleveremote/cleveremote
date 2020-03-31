import { EntityRepository, Repository, DeleteResult, FindManyOptions } from "typeorm";
import { TransceiverEntity } from "../entities/transceiver.entity";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { from, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { TransceiverDto } from "../dto/transceiver.dto";
import { TransceiverQueryDto } from "../dto/transceiver.query.dto";
import { classToClass } from "class-transformer";
import { Inject, forwardRef } from "@nestjs/common";
import { KafkaService } from "../../kafka/services/kafka.service";

@EntityRepository(TransceiverEntity)
export class TransceiverExt extends Repository<TransceiverEntity> implements ISynchronize<TransceiverEntity | boolean> {

    constructor() {
        super();
    }

    public synchronize(params: ISynchronizeParams): Observable<TransceiverEntity | boolean> {
        switch (params.action) {
            case 'ADD':
                return this.addTransceiver(classToClass<TransceiverDto>(params.data));
            case 'UPDATE':
                return this.updateTransceiver(classToClass<TransceiverDto>(params.data));
            case 'DELETE':
                return this.deleteTransceiver(params.data);
            default:
                break;
        }
    }

    public getDeviceId(id: string): Observable<string> {
        return of('server_1');
    }

    public updateTransceiver(data: any, sync = true): Observable<TransceiverEntity> {
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

    public deleteTransceiver(transceiverId: string): Observable<boolean> {
        return from(this.delete({ id: transceiverId })).pipe(
            map((deleteResult: DeleteResult) => {

                if (!deleteResult) {
                    console.log('Failed to delete');

                    return undefined;
                }

                return true;
            }));
    }

    public getAll(transceiverQueryDto: TransceiverQueryDto): Observable<Array<TransceiverEntity>> {
        const filter = {};

        for (let [key, value] of Object.entries(transceiverQueryDto)) {
            filter[key] = value;
        }

        return from(this.find({ where: filter, relations: ['modules'] })).pipe(
            map((transceivers: Array<TransceiverEntity>) => {

                if (transceivers.length === 0) {
                    console.log('No transceivers');

                    return [];
                }

                return transceivers;
            }));
    }

    public getTransceiver(transceiverId: string): Observable<TransceiverEntity> {
        return from(this.findOne({ where: { id: transceiverId }, relations: ['modules'] })).pipe(
            map((transceiver: TransceiverEntity) => {

                if (!transceiver) {
                    console.log('no module found');

                    return undefined;
                }

                return transceiver;
            }));
    }
}
