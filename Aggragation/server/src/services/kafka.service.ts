import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable } from 'rxjs';
import { Consumer, Offset, KafkaClient, Producer, KeyedMessage, ConsumerGroup, ConsumerGroupOptions, Message, HighLevelProducer, CustomPartitionAssignmentProtocol } from 'kafka-node';
import { DispatchService } from './dispatch.service';
import { v1 } from 'uuid';


export interface IPartitionTopic {
    partitions: number;
    lastPartition: number;
}

export interface ITopic {
    topic: string;
    partitionTopic: IPartitionTopic;
}

export class KafkaService {
    public consumer: Array<ConsumerGroup> = [];
    public producer: Producer;
    public offset: Offset;
    public subscribeTopics: Array<string> = [];
    public publishTopics: Array<string> = [];
    private readonly client: KafkaClient = undefined;
    private readonly dispatchService: DispatchService;
    private readonly dynamicTopics: Array<ITopic>;

    constructor() {

        process.env.KAFKA_TOPICS_PUBLICATION.split(';').forEach((topic: string) => {
            this.publishTopics.push(topic);
        });

        process.env.KAFKA_TOPICS_SUBSCRIPTION.split(';').forEach((topic: string) => {
            this.subscribeTopics.push(topic);
        });

        // process.env.KAFKA_TOPICS.split(' ').forEach((topic: string) => {
        //     const topicObj = topic.split('.');
        //     if (topicObj[1] === 'subscribe') {
        //         this.subscribeTopics.push(topicObj[0]);
        //     } else {
        //         this.publishTopics.push(topicObj[0]);
        //     }
        // });

        this.client = new KafkaClient({ kafkaHost: process.env.KAFKA_HOSTS });
        this.dispatchService = new DispatchService(this.subscribeTopics);
        this.client.loadMetadataForTopics(['topic1'], (error, results) => {
            console.log('%j', results);
            this.createConsumers(results);

            this.producer = new Producer(this.client, { requireAcks: 1 });
            this.offset = new Offset(this.client);



            // if (process.env.NODE_ENV === 'development') {
            //     this.dispatchService.checkFirstConnection().subscribe((result: boolean) => {
            //         const topicsToCreate = [
            //             { topic: 'topic1', partitions: 5, replicationFactor: 2 },
            //             { topic: 'topic2', partitions: 5, replicationFactor: 2 }
            //         ];
            //         const idBox = v1();
            //         this.client.createTopics(topicsToCreate, (error, res) => {
            //             const t = 2;
            //             this.consumer.addTopics(['topic1', 'topic2'], (err, added) => {
            //                 const t = 2;
            //             });
            //         });
            //     });
            // }






            const producerBIs = new HighLevelProducer(this.client, { requireAcks: 1, partitionerType: 4 }, (partitions: any, key: any) => {
                // key = key || '0';
                // var index = parseInt(key) % partitions.length;
                // return partitions[index];
                const test = this;
                const t = 2;

                return t;
            });

            // const producerBIs = new HighLevelProducer(this.client, { requireAcks: 1, partitionerType: 2 });

            producerBIs.on('ready', () => {
                setInterval(() => {
                    const payloads = [
                        { topic: 'topic1', messages: 'test1', key: 'test_theKey1' }
                    ];

                    producerBIs.send(payloads, (err, data) => {
                        console.log(data);
                    });
                }, 1000);
            });

        });




        // this.offset.fetch([
        //     { topic: this.topicTest, partition: 0, time: -1, maxNum: 1 }
        // ], function (err, data) {
        //     data
        //     { 't': { '0': [999] } }
        // });
    }

    public setCustomPartitionAssignmentProtocol(): Array<CustomPartitionAssignmentProtocol> {
        const customPartitionAssignmentProtocol: CustomPartitionAssignmentProtocol = {
            name: "customProtocol",
            version: 0,
            userData: {},
            assign: (topicPartition: any, groupMembers: any, cb: (error: any, result: any) => void) => {
                const ret: Array<any> = [];
                groupMembers.forEach((groupMember, index) => {
                    ret.push(
                        {
                            memberId: groupMember.id,
                            topicPartitions: {
                                "topic1": [
                                    index
                                ]
                            },
                            version: 0
                        }
                    );
                });
                cb(undefined, ret);
            }
        };

        return [customPartitionAssignmentProtocol];
    }

    public createConsumers(globalMetaData: any): void {
        const cgOptions: ConsumerGroupOptions = {
            kafkaHost: process.env.KAFKA_HOSTS,
            batch: { noAckBatchSize: 1024, noAckBatchAge: 10 },
            groupId: 'groupID',
            sessionTimeout: 15000,
            protocol: this.setCustomPartitionAssignmentProtocol(),
            fromOffset: "latest",
            migrateHLC: false,
            migrateRolling: true
        };
        const topicObject = globalMetaData[1].metadata["topic1"];
        if (topicObject) {
            Object.keys(topicObject).forEach((key, index) => {
                const data = topicObject[key];
                const consumerOptions = { ...cgOptions, id: `consumer${data.partition}` };
                this.consumer.push(new ConsumerGroup(Object.assign({ id: `consumer${data.partition}` }, cgOptions), [data.topic]));
            }
            );
        }

    }

    public getPartition(partitions, key: string) {
        const index = key.split('_');
    }

    public initializeProducer(): void {
        const km = new KeyedMessage('key', 'message');
        const payloads = [
            { topic: 'topic-mitosis', messages: 'hi', partition: 0 },
            { topic: 'topic-mitosis', messages: ['hello', 'world1', km] }
        ];
        this.producer.on('ready', () => {
            this.producer.send(payloads, (err, data) => {
                console.log(data);
            });
        });
        this.producer.on('error', (err: any) => {
            console.log('error', err);
        });
    }

    public initializeConsumer(): void {
        this.consumer.forEach(consumer => {
            consumer.on('offsetOutOfRange', (topic: any) => {
                topic.maxNum = 1;
                this.offset.fetch([topic], (err, offsets) => {
                    if (err) {
                        console.log('error', err);
                    }
                    const min = Math.min(offsets[topic.topic][topic.partition]);
                    consumer.setOffset(topic.topic, topic.partition, min);
                });
            });
            consumer.on('message', (message: Message) => {
                console.log(
                    '%s read msg Topic="%s" Partition=%s Offset=%d',
                    consumer.memberId,
                    message.topic,
                    message.partition,
                    message.offset
                );
                this.dispatchService.routeMessage(message);
            });
            consumer.on('error', (err: any) => {
                console.log('error', err);
            });
        });

    }

    public init(): Observable<void> {
        return this.initListners();
    }

    public initListners(): Observable<void> {
        console.log('* start init kafka...');

        return observableOf(true).pipe(
            map(() => {
                console.log('* init kafka OK');
                this.initializeConsumer();
                this.initializeProducer();
            }));
    }
}
