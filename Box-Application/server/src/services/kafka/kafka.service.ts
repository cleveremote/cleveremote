import { map, tap, mergeMap, flatMap, merge, take, repeatWhen, takeUntil, delay, takeWhile, repeat, retryWhen, catchError } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, bindCallback, from, interval, Subject } from 'rxjs';
// tslint:disable-next-line:max-line-length
import { Offset, KafkaClient, ConsumerGroupOptions, HighLevelProducer, CustomPartitionAssignmentProtocol, ClusterMetadataResponse, ConsumerGroupStream, ProduceRequest, ProducerStream } from 'kafka-node';
import { DispatchService } from '../dispatch.service';
import { v1 } from 'uuid';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../../entities/custom.repositories/device.ext";
import { Device } from '../../entities/gen.entities/device';
import { Tools } from '../tools-service';
import { ITopic } from '../../entities/interfaces/entities.interface';
import { AccountExt } from '../../entities/custom.repositories/account.ext';
import { CustomPartitionnerService } from './customPartitionner.service';
import { genericRetryStrategy } from '../tools/generic-retry-strategy';
import { KafkaInit } from './kafka.init';

export class KafkaService extends KafkaInit {
    public static instance: KafkaService;


    public checkFirstConnexion(): Observable<boolean> {

        return of(true);
    }


    public sendMessage(payloads: Array<ProduceRequest>, checkResponse = false): Observable<any> {
        const sendObs = bindCallback(this.producer.sendPayload.bind(this.producer, payloads));
        if (checkResponse) {
            return sendObs().pipe(mergeMap((data: any) => {
                Tools.loginfo('   - message sent => ');
                console.log(data);

                return of(data);
            })).pipe(mergeMap((data: any) =>
                KafkaService.instance.checkReponseMessage(data)));
        }

        return sendObs().pipe(mergeMap((data: any) => {
            Tools.loginfo('   - message sent => ');
            console.log(data);

            return of(data);
        }));

    }

    // public checkReponseMessage(data: any): Observable<any> {

    //     return of(data).pipe(
    //         mergeMap((x: any) => {
    //             const topicInfo = Object.keys(data[1])[0];
    //             const offset = new Offset(this.clientProducer);
    //             const offsetObs = bindCallback(offset.fetchCommits.bind(offset, process.env.BOX_GROUPID, [
    //                 { topic: topicInfo, partition: Object.keys(data[1][topicInfo])[0] }
    //             ]));

    //             return offsetObs().pipe(
    //                 map((results: any) => {
    //                     if (!!(results.message || results[0] !== null)) {
    //                         Tools.logSuccess('     => KO');
    //                         throw false;
    //                     }
    //                     const offsetRes: number = results[1][topicInfo][Object.keys(data[1][topicInfo])[0]];
    //                     const offsetIn: number = data[1][topicInfo][Object.keys(data[1][topicInfo])[0]];
    //                     const partitionRes = Object.keys(results[1][topicInfo])[0];
    //                     const partitionIn = Object.keys(data[1][topicInfo])[0];
    //                     if ((offsetRes >= offsetIn + 1) && partitionRes === partitionIn) {
    //                         Tools.logSuccess(`     => OK [PartitionIn,OffsetIn]=[${partitionIn},${offsetIn}] [PartitionRes,OffsetRes]=[${partitionRes},${offsetRes}]`);

    //                         return { pin: partitionIn, oin: offsetIn };
    //                     }
    //                     Tools.logSuccess(`     => KO [PartitionIn,OffsetIn]=[${partitionIn},${offsetIn}] [PartitionRes,OffsetRes]=[${partitionRes},${offsetRes}]`);
    //                     throw { status: 'KO', message: "process timeOut!" };
    //                 })
    //             );
    //         }),
    //         retryWhen(genericRetryStrategy({ durationBeforeRetry: 200, maxRetryAttempts: 40 }))
    //     );
    // }

    public checkReponseMessage(data: any): Observable<any> {

        return of(data).pipe(
            mergeMap((x: any) => {
                const topicInfo = Object.keys(data[1])[0];
                const offset = new Offset(this.clientProducer);
                const offsetObs = bindCallback(offset.fetchCommits.bind(offset, process.env.AGGREGATION_GROUPID, [
                    { topic: topicInfo, partition: Object.keys(data[1][topicInfo])[0] }
                ]));

                return offsetObs().pipe(
                    map((results: any) => {
                        if (!!(results.message || results[0] !== null)) {
                            Tools.logSuccess('     => KO');
                            throw false;
                        }
                        const offsetRes: number = results[1][topicInfo][Object.keys(data[1][topicInfo])[0]];
                        const offsetIn: number = data[1][topicInfo][Object.keys(data[1][topicInfo])[0]];
                        const partitionRes = Object.keys(results[1][topicInfo])[0];
                        const partitionIn = Object.keys(data[1][topicInfo])[0];
                        if ((offsetRes >= offsetIn + 1) && partitionRes === partitionIn) {
                            Tools.logSuccess(`     => OK [PartitionIn,OffsetIn]=[${partitionIn},${offsetIn}] [PartitionRes,OffsetRes]=[${partitionRes},${offsetRes}]`);

                            return { pin: partitionIn, oin: offsetIn };
                        }
                        Tools.logSuccess(`     => KO [PartitionIn,OffsetIn]=[${partitionIn},${offsetIn}] [PartitionRes,OffsetRes]=[${partitionRes},${offsetRes}]`);
                        throw { status: 'KO', message: "process timeOut!" };
                    })
                );
            }),
            retryWhen(genericRetryStrategy({ durationBeforeRetry: 200, maxRetryAttempts: 40 }))
        );
    }

    public init(): Observable<boolean> {
        return super.init().pipe(flatMap((x: any) => this.checkFirstConnexion().pipe(map((result: boolean) => !!(KafkaService.instance = this)))));
    }

}
