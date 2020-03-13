import { map, tap, mergeMap, flatMap, retryWhen, take, catchError } from 'rxjs/operators';
import { Observable, of, observable, bindCallback, timer, race, fromEvent } from 'rxjs';
import { Message, Offset, KafkaClient, ConsumerGroupOptions, ClusterMetadataResponse, ConsumerGroupStream, ProduceRequest, ProducerStream } from 'kafka-node';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../../entities/custom.repositories/device.ext";
import { Device } from '../../entities/gen.entities/device';
import { Tools } from '../tools-service';
import { ITopic } from '../../entities/interfaces/entities.interface';
import { genericRetryStrategy } from '../tools/generic-retry-strategy';
import { v1 } from 'uuid';
import { KafkaInit } from './kafka.init';

export class KafkaService extends KafkaInit {
    public static instance: KafkaService;

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
                return obs.pipe(mergeMap((response: any) => this.waitResponseAck('box_action_response', 5000)));
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
                    // .pipe(mergeMap((isCommited: boolean) => this.sendAck(isCommited, { ack: true })))
                );
            });

            return race(obs);
        }

        return of(true);
    }

    public commitMessage(consumer: ConsumerGroupStream, message: Message, force = false): Observable<boolean> {
        const commitBind = bindCallback(consumer.commit.bind(consumer, message, force));
        return commitBind().pipe(map((result: Array<any>) => true));
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
        return fromEvent(consumer, 'data').pipe(take(1));
    }

    public checkReponseMessage(data: any): Observable<any> {

        return of(data).pipe(
            mergeMap((x: any) => {
                const topicInfo = Object.keys(data[1])[0];
                const offset = new Offset(this.clientProducer);
                const offsetObs = bindCallback(offset.fetchCommits.bind(offset, process.env.BOX_GROUPID, [
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
            retryWhen(genericRetryStrategy({ durationBeforeRetry: 1000, maxRetryAttempts: 40 })),
            catchError((error: any) => {
                console.log(JSON.stringify(error));

                return error;
            })
        );
    }

    public init(): Observable<boolean> {
        return super.init().pipe(map((x: any) => !!(KafkaService.instance = this)));
    }

}
