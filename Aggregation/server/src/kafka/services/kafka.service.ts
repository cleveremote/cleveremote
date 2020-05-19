import { map, tap, mergeMap, flatMap, retryWhen, take, catchError, filter, delay, timeout } from 'rxjs/operators';
import { Observable, of, observable, bindCallback, timer, race, fromEvent, forkJoin } from 'rxjs';
import { Message, Offset, KafkaClient, ConsumerGroupOptions, ClusterMetadataResponse, ConsumerGroupStream, ProduceRequest, ProducerStream } from 'kafka-node';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../../manager/repositories/device.ext";
import { DeviceEntity } from '../../manager/entities/device.entity';
import { Tools } from '../../common/tools-service';
import { ITopic } from '../../manager/interfaces/entities.interface';
import { genericRetryStrategy } from '../../common/generic-retry-strategy';
import { v1 } from 'uuid';
import { KafkaBase } from './kafka.base';
import { ConsumerCustom } from '../classes/consumer.custom.class';
import { ISendResponse } from '../interfaces/send.response.interface';
import { Payload } from '../classes/payload.class';
import { IPartitionConfig } from "../../kafka/interfaces/partition.config.interface";
import { MapperService } from '../../common/mapper.service';

export class KafkaService extends KafkaBase {
    public static instance: KafkaService;
    constructor() {
        super();
        KafkaService.instance = this;
    }

    public sendMessage(payloads: Array<ProduceRequest>, checkResponse = false, ackFrom = 'aggregator_ack', timeOut = 60000): Observable<ISendResponse | [Message, boolean]> {
        const messageId = JSON.parse(payloads[0].messages).messageId;
        const sendObs = bindCallback(this.producer.sendPayload.bind(this.producer, payloads));
        let obs: Observable<ISendResponse | [Message, boolean]> = of(true)
            .pipe(delay(200))
            .pipe(mergeMap(() => sendObs()))
            .pipe(mergeMap((data: [any, ISendResponse]) => {
                Tools.loginfo('   - message sent => ');
                Tools.logWarn(`   ${JSON.stringify(payloads)}`);
                return of(data[1]);
            }));
        if (checkResponse) {
            obs = obs.pipe(mergeMap((data: ISendResponse) => this.checkReponseMessage(messageId, checkResponse, ackFrom, timeOut)));
        }
        return obs.pipe(catchError(e => { throw { error: payloads }; }));
    }

    public waitResponseAck(messageId: string, topicName: string, timeOut: number): Observable<Message> {
        Tools.loginfo('   - checking proccessing ');
        const consumersByTopic = this.getConsumersByToptic(topicName);

        if (consumersByTopic.length === 0) {
            throw { error: "No consumer" };
        }

        if (consumersByTopic.length === 1) {
            return this.startListenConsumer(consumersByTopic[0], messageId, timeOut)
                .pipe(mergeMap((message: Message) => this.commitMessage(consumersByTopic[0].consumer, message, true)));
        }
        const obs = [];
        consumersByTopic.forEach(consumer => {
            obs.push(this.startListenConsumer(consumer, messageId, timeOut)
                .pipe(mergeMap((message: Message) => this.commitMessage(consumer.consumer, message, true)))
            );
        });
        return race(obs);
    }

    public commitMessage(consumer: ConsumerGroupStream, message: Message, force = false): Observable<Message> {
        const commitBind = bindCallback(consumer.commit.bind(consumer, message, force));
        return commitBind().pipe(mergeMap((result: Array<any>) => {
            console.log('consumer read msg %s Topic="%s" Partition=%s Offset=%d', message.value, message.topic, message.partition, message.offset);
            return of(message);
        }));
    }

    public checkReponseMessage(messageId: string, needAck = false, ackFrom = 'aggregator_ack', timeOut = 15000): Observable<[Message, boolean]> {
        const obsLst = [];
        if (needAck) {
            obsLst.push(this.waitResponseAck(messageId, ackFrom, timeOut));
        }
        obsLst.push(of(true));

        return forkJoin(obsLst).pipe(map((results: [Message, boolean]) => results));
    }

    // public init(): Observable<boolean> {
    //     return super.init().pipe(map((x: any) => !!(KafkaService.instance = this)));
    // }

    public sendAck(message: any, BoxId: string): Observable<ISendResponse | [Message, boolean]> {
        const payloads = [new Payload('box_ack', JSON.stringify(message), `box_ack.${BoxId}`)];
        return this.sendMessage(payloads);
    }

    public startListenConsumer(consumer: ConsumerCustom, messageId: string, timeOut = 15000): Observable<Message> {
        return consumer.eventData
            .pipe(filter((message: Message) => JSON.parse(String(message.value)).messageId === messageId))
            .pipe(take(1)).pipe(timeout(timeOut));
    }


    public initKafka(devicesConfig: Array<IPartitionConfig>): Observable<Array<IPartitionConfig> | boolean> {
        const progressBar = Tools.startProgress('Kafka initialize configuration     ', 0, 3, '* Start micro-service KAFKA');
        return this.initializeCLients()
            .pipe(tap(() => progressBar.increment()))
            .pipe(flatMap(() => this.setCheckhError()))
            .pipe(tap(() => progressBar.increment()))
            .pipe(flatMap(() => this.setPublicationTopics(devicesConfig)))
            .pipe(tap(() => progressBar.increment()))
            .pipe(mergeMap(() => this.setSubscriptionTopics()), catchError(val => of(false)))
            .pipe(tap(() => progressBar.increment()))
            .pipe(mergeMap(() => this.initializeConsumer()), catchError(val => of(false)))
            .pipe(map(() => devicesConfig))
            .pipe(tap(() => progressBar.increment()))
            .pipe(tap(() => Tools.stopProgress('Kafka initialize configuration     ', progressBar)))
            .pipe(
                catchError(error => {
                    Tools.stopProgress('Kafka initialize configuration     ', progressBar, error);
                    return of(false);
                })
            );
    }

    // public init(): Observable<boolean> {
    //     return this.InitClients().pipe(
    //         flatMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION).pipe(
    //             flatMap(() => this.setPublicationTopics(process.env.KAFKA_TOPICS_PUBLICATION).pipe(
    //                 flatMap(() => this.initializeConsumer()))
    //             ))
    //         ));
    // }

    public syncDataWithBox(dataToSync: any, action: string, entityName: string, id: string): Observable<boolean> {
        const mapper = new MapperService();
        const payloads = [{
            topic: 'box_dbsync',
            messages: JSON.stringify({ messageId: v1(), entity: entityName, action: action, data: dataToSync }), key: `box_dbsync.${mapper.getDeviceId(entityName, id)}`
        }];
        return this.sendMessage(payloads, true).pipe(map(() => true));
    }

    public sendBoxAction(dataToSync: any, action: string, deviceId: string): Observable<any> {
        const mapper = new MapperService();
        const payloads = [{
            topic: 'box_action',
            messages: JSON.stringify({ messageId: v1(), action: 'Get', entity: 'Scan', data: dataToSync }), key: `box_action.${deviceId}`
        }];
        return this.sendMessage(payloads, true).pipe(map((response: any) => response));
    }

    public sendDeliveryMessage(payloads: Array<ProduceRequest>, checkResponse = true, ackFrom = 'box_ack', timeOut = 15000): Observable<ISendResponse | [Message, boolean]> {
        const messageId = JSON.parse(payloads[0].messages).messageId;
        const sendObs = bindCallback(this.producer.sendPayload.bind(this.producer, payloads));
        let obs: Observable<ISendResponse | [Message, boolean]> = of(true)
            .pipe(delay(200))
            .pipe(mergeMap(() => sendObs()))
            .pipe(mergeMap((data: [any, ISendResponse]) => {
                Tools.loginfo('   - message sent => ');
                Tools.logWarn(`   ${JSON.stringify(payloads)}`);
                return of(data[1]);
            }));
        if (checkResponse) {
            obs = obs.pipe(mergeMap((data: ISendResponse) => this.checkReponseMessage1(data)));
        }
        return obs;
    }

    public checkReponseMessage1(data: any): Observable<any> {

        return of(data).pipe(
            mergeMap((x: any) => {
                const topicInfo = Object.keys(data)[0];
                const offset = new Offset(this.clientProducer);
                const offsetObs = bindCallback(offset.fetchCommits.bind(offset, process.env.BOX_GROUPID, [
                    { topic: topicInfo, partition: Object.keys(data[topicInfo])[0] }
                ]));

                return offsetObs().pipe(
                    map((results: any) => {
                        if (!!(results.message || results[0] !== null)) {
                            Tools.logSuccess('     => KO');
                            throw false;
                        }
                        const offsetRes: number = results[1][topicInfo][Object.keys(data[topicInfo])[0]];
                        const offsetIn: number = data[topicInfo][Object.keys(data[topicInfo])[0]];
                        const partitionRes = Object.keys(results[1][topicInfo])[0];
                        const partitionIn = Object.keys(data[topicInfo])[0];
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
}
