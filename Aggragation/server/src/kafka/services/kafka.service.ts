import { map, tap, mergeMap, flatMap, retryWhen, take, catchError, filter, delay } from 'rxjs/operators';
import { Observable, of, observable, bindCallback, timer, race, fromEvent, forkJoin } from 'rxjs';
import { Message, Offset, KafkaClient, ConsumerGroupOptions, ClusterMetadataResponse, ConsumerGroupStream, ProduceRequest, ProducerStream } from 'kafka-node';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../../manager/repositories/device.ext";
import { Device } from '../../manager/entities/device';
import { Tools } from '../../common/tools-service';
import { ITopic } from '../../manager/interfaces/entities.interface';
import { genericRetryStrategy } from '../../common/generic-retry-strategy';
import { v1 } from 'uuid';
import { KafkaInit } from './kafka.init';
import { ConsumerCustom } from '../classes/consumer.custom.class';

export class KafkaService extends KafkaInit {
    public static instance: KafkaService;

    // public sendMessage(payloads: Array<ProduceRequest>, checkResponse = false, ack = false): Observable<any> {
    //     const sendObs = bindCallback(this.producer.sendPayload.bind(this.producer, payloads));
    //     if (checkResponse) {
    //         const obs = sendObs().pipe(mergeMap((data: any) => {
    //             Tools.loginfo('   - message sent => ');
    //             console.log(data);

    //             return of(data);
    //         })).pipe(mergeMap((data: any) =>
    //             this.checkReponseMessage(data)));
    //         if (ack) {
    //             return obs.pipe(mergeMap((response: any) => this.waitResponseAck('box_action_response', 5000)));
    //         }

    //         return obs;
    //     }

    //     return sendObs().pipe(mergeMap((data: any) => {
    //         Tools.loginfo('   - message sent => ');
    //         console.log(data);

    //         return of(data);
    //     }));

    // }

    public sendMessage(payloads: Array<ProduceRequest>, checkResponse = false, ack = false, ackFrom = 'box_action_response'): Observable<any> {
        const messageId = JSON.parse(payloads[0].messages).messageId;
        const sendObs = bindCallback(this.producer.sendPayload.bind(this.producer, payloads));
        let obs = of(true)
            .pipe(delay(200))
            .pipe(mergeMap((data: any) => sendObs()))
            .pipe(mergeMap((data: any) => {
                Tools.loginfo('   - message sent => ');
                console.log(data[1]);
                return of(data);
            }));
        if (checkResponse) {
            obs = obs.pipe(mergeMap((data: any) => this.checkReponseMessage(messageId, data, ack, ackFrom)));
        }
        // if (ack) {
        //     obs = obs.pipe(mergeMap((response: any) => this.waitResponseAck(ackFrom, 5000)));
        // }
        return obs;
    }

    public waitResponseAck(messageId: string, target: string, timeout: number): Observable<any> {
        const consumersFound =
            this.consumers.filter((consumer: ConsumerCustom) => {
                const exits = (consumer.consumer.consumerGroup as any).topics.find((topic: string) =>
                    topic.indexOf(target) !== -1);

                return exits ? true : false;
            });
        if (consumersFound && consumersFound.length > 0) {
            const obs = [];
            consumersFound.forEach(consumer => {
                obs.push(this.startListenConsumer(consumer, messageId, target)
                    .pipe(mergeMap((message: Message) => this.commitMessage(consumer.consumer, message, true)))
                    // .pipe(mergeMap((isCommited: boolean) => this.sendAck(isCommited, { ack: true })))
                );
            });

            return race(obs);
        }

        return of(true);
    }

    public commitMessage(consumer: ConsumerGroupStream, message: Message, force = false): Observable<Message> {
        const commitBind = bindCallback(consumer.commit.bind(consumer, message, force));
        return commitBind().pipe(mergeMap((result: Array<any>) => {
            console.log('consumer read msg %s Topic="%s" Partition=%s Offset=%d', message.value, message.topic, message.partition, message.offset);
            return of(message);
        }));

    }

    public sendAck(isCommited: boolean, message: any): Observable<any> {
        if (!isCommited) {
            return of(false);
        }
        const payloads = [
            { messageId: v1(), topic: 'box_action_response', messages: JSON.stringify(message), key: 'server_1' }
        ];

        return this.sendMessage(payloads, true);
    }

    public startListenConsumer(consumer: ConsumerCustom, messageId: string, flt?: string): Observable<any> {
        return consumer.eventData
            .pipe(filter((message: Message) => flt ? message.topic.indexOf(flt) !== -1 && JSON.parse(String(message.value)).messageId === messageId : true))
            .pipe(take(1));
    }

    // public checkReponseMessage(data: any, needAck = false, ackFrom = 'action_box_response'): Observable<any> {

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
    //                     // Tools.logSuccess(`     => KO [PartitionIn,OffsetIn]=[${partitionIn},${offsetIn}] [PartitionRes,OffsetRes]=[${partitionRes},${offsetRes}]`);
    //                     throw { status: 'KO', message: "process timeOut!" };
    //                 })
    //             );
    //         }),
    //         retryWhen(genericRetryStrategy({ durationBeforeRetry: 200, maxRetryAttempts: 40 })),
    //         catchError((error: any) => {
    //             console.log(JSON.stringify(error));

    //             return error;
    //         })
    //     );
    // }

    public checkReponseMessage(messageId: string, data: any, needAck = false, ackFrom = 'box_action_response'): Observable<any> {
        Tools.loginfo('   - checking delivery ');
        const obsLst = [];
        let waitObs = of(true);
        if (needAck) {
            waitObs = this.waitResponseAck(messageId, ackFrom, 5000);
        }
        obsLst.push(waitObs)

        // const checkObs = of(data).pipe(
        //     mergeMap((x: any) => {
        //         const topicInfo = Object.keys(data[1])[0];
        //         const offset = new Offset(this.clientProducer);
        //         const offsetObs = bindCallback(offset.fetchCommits.bind(offset, process.env.BOX_GROUPID, [
        //             { topic: topicInfo, partition: Object.keys(data[1][topicInfo])[0] }
        //         ]));

        //         return offsetObs().pipe(
        //             map((results: any) => {
        //                 if (!!(results.message || results[0] !== null)) {
        //                     Tools.logSuccess('     => KO');
        //                     throw false;
        //                 }
        //                 const offsetRes: number = results[1][topicInfo][Object.keys(data[1][topicInfo])[0]];
        //                 const offsetIn: number = data[1][topicInfo][Object.keys(data[1][topicInfo])[0]];
        //                 const partitionRes = Object.keys(results[1][topicInfo])[0];
        //                 const partitionIn = Object.keys(data[1][topicInfo])[0];
        //                 if ((offsetRes >= offsetIn + 1) && partitionRes === partitionIn) {
        //                     Tools.logSuccess(`     => message sent OK`);
        //                     return { pin: partitionIn, oin: offsetIn };
        //                 }
        //                 Tools.logSuccess(`     => KO [PartitionIn,OffsetIn]=[${partitionIn},${offsetIn}] [PartitionRes,OffsetRes]=[${partitionRes},${offsetRes}]`);
        //                 throw { status: 'KO', message: "process timeOut!" };
        //             })
        //         );
        //     }),
        //     retryWhen(genericRetryStrategy({ durationBeforeRetry: 100, maxRetryAttempts: 200 })),
        //     catchError((error: any) => {
        //         console.log(JSON.stringify(error));

        //         return error;
        //     })
        // );
        // obsLst.push(checkObs);

        return forkJoin(obsLst).pipe(mergeMap((results: Array<any>) => {
            const waitResult = results[0];
            const sentResult = results[1];
            if (needAck && waitResult) {
                return of(waitResult);
            } else if (!needAck) {
                return of(sentResult);
            }

        }))
    }

    public init(): Observable<boolean> {
        return super.init().pipe(map((x: any) => !!(KafkaService.instance = this)));
    }

}
