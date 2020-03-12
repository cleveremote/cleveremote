import { map, tap, mergeMap, flatMap, merge, take, repeatWhen, takeUntil, delay, takeWhile, repeat, retryWhen, catchError, filter } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, bindCallback, from, interval, Subject, fromEvent } from 'rxjs';
// tslint:disable-next-line:max-line-length
import { Offset, KafkaClient, ConsumerGroupOptions, HighLevelProducer, CustomPartitionAssignmentProtocol, ClusterMetadataResponse, ConsumerGroupStream, ProduceRequest, ProducerStream } from 'kafka-node';
import { v1 } from 'uuid';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../../manager/repositories/device.ext";
import { Tools } from '../../common/tools-service';
import { genericRetryStrategy } from '../../common/generic-retry-strategy';
import { KafkaBase } from './kafka.base';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class KafkaService extends KafkaBase {

    public sendMessage(payloads: Array<ProduceRequest>, checkResponse = false): Observable<any> {
        const sendObs = bindCallback(this.producer.sendPayload.bind(this.producer, payloads));
        if (checkResponse) {
            return sendObs().pipe(mergeMap((data: any) => {
                Tools.loginfo('   - message sent => ');
                console.log(data);

                return of(data);
            })).pipe(mergeMap((data: any) =>
                this.checkReponseMessage(data)));
        }

        return sendObs().pipe(mergeMap((data: any) => {
            Tools.loginfo('   - message sent => ');
            console.log(data);

            return of(data);
        }));

    }

    public startListenerForSyncConnexion(): Observable<any> {
        const consumerFound = this.consumers.find((consumer: ConsumerGroupStream) => (this.consumers[0].consumerGroup as any).options.clientId === 'consumerfull');
        if (consumerFound) {
            return this.startListenConsumer(consumerFound).pipe(take(1));
        }
    }

    public startListenConsumer(consumer: any, flt?: string): Observable<any> {
        return fromEvent(consumer, 'data').pipe(filter((message: any) => {
            const objectToFilter = JSON.parse(message.value);
            return flt ? objectToFilter.entity === flt : true;
        }));
    }


    // .pipe(mergeMap((result: any) => {
    //     this.routeMessage(consumer, result);
    //     return of(true);
    // }));

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

    public initCommonKafka(): Observable<any> {
        Tools.loginfo('* Start micro-service KAFKA');
        this.progressBar = Tools.startProgress('KAFKA   ', 0, 5);
        return this.InitClients()
            .pipe(flatMap(() => this.setPublicationTopics(process.env.KAFKA_TOPICS_PUBLICATION)), catchError(val => val));
    }

    public init(cfg?: any): Observable<any> {
        Tools.loginfo('* Start micro-service KAFKA');
        let commonObs = this.InitClients()
            .pipe(flatMap(() => this.setPublicationTopics(process.env.KAFKA_TOPICS_PUBLICATION)), catchError(val => val));
        if (cfg) {
            this.progressBar = Tools.startProgress('KAFKA   ', 0, 5);
            return commonObs.pipe(mergeMap(() => this.initKafka()));
        }
        // it is new connexion 
        return of(true)
            .pipe(flatMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION, cfg)), catchError(val => val))
            .pipe(flatMap(() => this.initializeConsumer()), catchError(val => val))
            .pipe(catchError((response: any) => {
                Tools.stopProgress('KAFKA   ', this.progressBar, response);
                return of(false);
            }));

    }

    public initKafka(cfg?: any): Observable<any> {
        return of(true)
            .pipe(mergeMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION, cfg)), catchError(val => val))
            .pipe(mergeMap(() => this.initializeConsumer()), catchError(val => val))
            .pipe(catchError((response: any) => {
                Tools.stopProgress('KAFKA   ', this.progressBar, response);
                return of(false);
            }));
    }

}
