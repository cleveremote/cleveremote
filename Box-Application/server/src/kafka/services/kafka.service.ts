import { map, tap, mergeMap, flatMap, merge, take, repeatWhen, takeUntil, delay, takeWhile, repeat, retryWhen, catchError, filter } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, bindCallback, from, interval, Subject, fromEvent, timer, race, throwError, forkJoin } from 'rxjs';
// tslint:disable-next-line:max-line-length
import { Message, Offset, KafkaClient, ConsumerGroupOptions, HighLevelProducer, CustomPartitionAssignmentProtocol, ClusterMetadataResponse, ConsumerGroupStream, ProduceRequest, ProducerStream } from 'kafka-node';
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

    public sendMessage(payloads: Array<ProduceRequest>, checkResponse = false, ack = false): Observable<any> {
        const sendObs = bindCallback(this.producer.sendPayload.bind(this.producer, payloads));
        if (checkResponse) {
            const obs = sendObs().pipe(mergeMap((data: any) => {
                Tools.loginfo('   - message sent => ');
                console.log(data);

                return of(data);
            })).pipe(mergeMap((data: any) =>
                this.checkReponseMessage(data)));
            if (ack) {
                return obs.pipe(mergeMap((response: any) => this.waitResponseAck('init_connexion1', 5000)));
            }

            return obs;
        }

        return sendObs().pipe(mergeMap((data: any) => {
            Tools.loginfo('   - message sent => ');
            console.log(data);

            return of(data);
        }));

    }

    public waitResponseAck(target: string, timeout: number): Observable<any> {
        const consumersFound =
            this.consumers.filter((consumer: ConsumerGroupStream) => {
                const exits = (consumer.consumerGroup as any).topics.find((topic: string) =>
                    topic.indexOf(target) !== -1);
                return exits ? true : false;
            });
        if (consumersFound && consumersFound.length > 0) {
            const timer$ = timer(timeout);
            const obs = [];
            consumersFound.forEach(consumer => {
                obs.push(this.startListenConsumer(consumer)
                    .pipe(mergeMap((message: Message) => this.commitMessage(consumer, message, true)))
                    .pipe(mergeMap((isCommited: boolean) => this.sendAck(isCommited, { ack: true })))
                );
            });
            return race(obs);
        }
        return of(true);
    }

    public clearPreviousMessages(target: string, timeout: number): Observable<any> {
        const consumersFound =
            this.consumers.filter((consumer: ConsumerGroupStream) => {
                const exits = (consumer.consumerGroup as any).topics.find((topic: string) =>
                    topic.indexOf(target) !== -1);
                return exits ? true : false;
            });

        const topicInfo = '123456789_init_connexion1';
        const offset = new Offset(this.client);
        const offsetObs = bindCallback(offset.fetch.bind(offset, [
            { topic: topicInfo, time: -1 }
        ]));
        const offsetComittedObs = bindCallback(offset.fetchCommits.bind(offset, process.env.GROUPID, [
            { topic: topicInfo, partition: 0 }
        ]));

        const latestOffset = offsetObs().pipe(
            mergeMap((results: any) => {
                if (!!(results.message || results[0] !== null)) {
                    Tools.logSuccess('     => KO');
                    throw false;
                }
                const maxOffset = results[1][topicInfo][0];
                return of(maxOffset);
            })
        );


        return latestOffset.pipe(mergeMap(offsetmax =>
            offsetComittedObs().pipe(map((results: any) => {
                const lastcommitIndex = results[1][topicInfo][0];
                return (offsetmax[0] - lastcommitIndex);
            }))
        ))
            .pipe(mergeMap((maxToTake: number) => {
                if (consumersFound && consumersFound.length > 0) {
                    const timer$ = timer(timeout);
                    const obs = [];
                    if (maxToTake === 0) {
                        return of(true);
                    }
                    consumersFound.forEach(consumer => {
                        obs.push(this.startListenConsumerUntil(consumer, maxToTake)
                            .pipe(mergeMap((message: Message) => this.commitMessage(consumer, message, true)))
                            // .pipe(mergeMap((isCommited: boolean) => this.sendAck(isCommited, { ack: true })))
                        );
                    });
                    return forkJoin(obs);
                }
                return of({});
            }));
    }

    public commitMessage(consumer: ConsumerGroupStream, message: Message, force = false): Observable<boolean> {
        consumer.commit(message, true, (error, data) => {
            if (!error) {
                console.log('consumer read msg %s Topic="%s" Partition=%s Offset=%d', message.value, message.topic, message.partition, message.offset);
            } else {
                console.log(error);
            }
        });
        const commitBind = bindCallback(consumer.commit.bind(consumer, message, force));
        return commitBind().pipe(mergeMap((result: Array<any>) => of(true)));
    }

    public sendAck(isCommited: boolean, message: any): Observable<any> {
        if (!isCommited) {
            return of(false);
        }
        const payloads = [
            { topic: 'box_action_response', messages: JSON.stringify(message), key: 'server_1' }
        ];

        return this.sendMessage(payloads, true);
    }

    public startListenConsumer(consumer: any, flt?: string): Observable<any> {
        // const timer$ = timer(20000); //ttakeUntil(timer$)
        return fromEvent(consumer, 'data').pipe(take(1));
    }

    public startListenConsumerUntil(consumer: any, max?: number): Observable<any> {
        // const timer$ = timer(20000); //ttakeUntil(timer$)
        return of(true)
            .pipe(mergeMap(result =>
                fromEvent(consumer, 'data').pipe(mergeMap((res: any) => {
                    if (max - res.offset !== 0) {
                        this.commitMessage(consumer, res, true).subscribe();
                        return of(true);
                    }
                    return of(res);
                })).pipe(take(max)))
            );

    }

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

    public initKafka(cfg?: any): Observable<any> {
        return of(true)
            .pipe(mergeMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION, cfg)), catchError(val => val))
            .pipe(mergeMap(() => this.initializeConsumer()), catchError(val => val))
            .pipe(catchError((response: any) => {
                Tools.stopProgress('KAFKA   ', this.progressBar, response);
                return of(true);
            }));
    }

}
