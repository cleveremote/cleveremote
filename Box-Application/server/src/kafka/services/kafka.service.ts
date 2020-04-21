import { map, mergeMap, flatMap, take, delay, retryWhen, catchError, filter, tap, timeout } from 'rxjs/operators';
import { Observable, of, bindCallback, race, forkJoin, pipe } from 'rxjs';
import { Message, Offset, ConsumerGroupStream, ProduceRequest } from 'kafka-node';
import { v1 } from 'uuid';
import { Tools } from '../../common/tools-service';
import { genericRetryStrategy } from '../../common/generic-retry-strategy';
import { KafkaBase } from './kafka.base';
import { Injectable } from '@nestjs/common';
import { ConsumerCustom } from '../classes/consumer.custom.class';
import { Payload } from '../classes/payload.class';
import { ISendResponse } from '../interfaces/send.response.interface';
import { SendResponse } from '../classes/send.response.class';
import { IPartitionConfig } from '../interfaces/partition.config.interface';

@Injectable()
export class KafkaService extends KafkaBase {

    public sendMessage(payloads: Array<ProduceRequest>, checkResponse = false, ackFrom = 'box_ack', timeOut = 15000): Observable<ISendResponse | [Message, boolean]> {
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
        return obs;
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

    public clearPreviousMessages(topicName: string): Observable<boolean> {
        const offset = new Offset(this.client);
        const consumersByTopic = this.getConsumersByToptic(topicName);
        const obs = [];
        let progressBar;
        //todo message proccessing get message in pipe
        return this.getMaxToTake(offset, topicName)
            .pipe(mergeMap((maxToTake: number) => {
                progressBar = Tools.startProgress('Clear stream before start sync ', 0, maxToTake);
                if (consumersByTopic.length === 0) { return of(true); }

                if (consumersByTopic.length === 1) {
                    return this.startListenConsumerUntil(consumersByTopic[0], maxToTake, progressBar);
                }

                consumersByTopic.forEach(consumer => {
                    obs.push(this.startListenConsumerUntil(consumer, maxToTake, progressBar));
                });
                return forkJoin(obs);

            })).pipe(map(() => true))
            .pipe(tap(() => Tools.stopProgress('Clear stream before start sync ', progressBar)))
            .pipe(
                catchError(error => {
                    Tools.stopProgress('Clear stream before start sync ', progressBar, error);
                    return of(false);
                })
            );;
    }

    public commitMessage(consumer: ConsumerGroupStream, message: Message, force = false): Observable<Message> {
        const commitBind = bindCallback(consumer.commit.bind(consumer, message, force));
        return commitBind().pipe(mergeMap((result: [any, Message]) => {
            Tools.logWarn(`consumer read msg ${message.value} Topic=${message.topic} Partition=${message.partition} Offset=${message.offset}`);
            return of(message);
        }));
    }

    public sendAck(message: any): Observable<ISendResponse | [Message, boolean]> {
        const payloads = [new Payload('aggregator_ack', JSON.stringify(message), 'server_1')];
        return this.sendMessage(payloads);
    }

    public startListenConsumer(consumer: ConsumerCustom, messageId: string, timeOut = 15000): Observable<Message> {
        return consumer.eventData
            .pipe(filter((message: Message) => JSON.parse(String(message.value)).messageId === messageId))
            .pipe(take(1)).pipe(timeout(timeOut));
    }

    public startListenConsumerUntil(consumer: ConsumerCustom, maxToTake?: number, progressBar?: any, timeOut = 30000): Observable<boolean> {
        if (maxToTake) {
            return consumer.eventData.pipe(mergeMap((message: Message) => {
                if (maxToTake - message.offset !== 0) {
                    this.commitMessage(consumer.consumer, message, true).subscribe();
                    progressBar.increment();
                }
                return of(true);
            }))
                .pipe(take(maxToTake)).pipe(timeout(timeOut));
        }
        return of(true);
    }

    public checkReponseMessage(messageId: string, needAck = false, ackFrom = 'box_ack', timeOut = 15000): Observable<[Message, boolean]> {
        const obsLst = [];
        if (needAck) {
            obsLst.push(this.waitResponseAck(messageId, ackFrom, timeOut));
        }
        obsLst.push(of(true));

        return forkJoin(obsLst).pipe(map((results: [Message, boolean]) => results));
    }

    public initCommonKafka(): Observable<boolean> {
        const progressBar = Tools.startProgress('Kafka common configuration     ', 0, 3, '* Start micro-service KAFKA');
        return this.initializeCLients()
            .pipe(tap(() => progressBar.increment()))
            .pipe(flatMap(() => this.setCheckhError()))
            .pipe(tap(() => progressBar.increment()))
            .pipe(flatMap(() => this.setPublicationTopics(process.env.KAFKA_TOPICS_PUBLICATION)))
            .pipe(tap(() => progressBar.increment()))
            .pipe(tap(() => Tools.stopProgress('Kafka common configuration     ', progressBar)))
            .pipe(
                catchError(error => {
                    Tools.stopProgress('Kafka common configuration     ', progressBar, error);
                    return of(false);
                })
            );
    }

    public initKafka(partitionConfig?: IPartitionConfig): Observable<boolean> {
        const progressBar = Tools.startProgress('Kafka deep configuration       ', 0, 2);
        return of(true)
            .pipe(mergeMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION, partitionConfig)), catchError(val => of(false)))
            .pipe(tap(() => progressBar.increment()))
            .pipe(mergeMap(() => this.initializeConsumer()), catchError(val => of(false)))
            .pipe(tap(() => progressBar.increment()))
            .pipe(tap(() => Tools.stopProgress('Kafka deep configuration       ', progressBar)))
            .pipe(
                catchError(error => {
                    Tools.stopProgress('Kafka deep configuration       ', progressBar, error);
                    return of(false);
                })
            );
    }

    public executeDbSync(dataToSync: any, action: string, entityName: string, boxId: string): Observable<boolean> {
        const payloads = [{
            topic: 'aggregator_dbsync',
            messages: JSON.stringify({ sourceId: boxId, messageId: v1(), entity: entityName, action: action, data: dataToSync }), key: 'server_1'
        }];
        return this.sendMessage(payloads, true).pipe(map(() => true));
    }

    public executeSync(type: string, dataToSync: any, action: string, entityName: string, boxId: string): Observable<boolean> {
        const payloads = [{
            topic: type,
            messages: JSON.stringify({ sourceId: boxId, messageId: v1(), entity: entityName, action: action, data: dataToSync }), key: 'server_1'
        }];
        return this.sendMessage(payloads, false).pipe(map(() => true));
    }

}
