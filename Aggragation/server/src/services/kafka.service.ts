import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable } from 'rxjs';
import { Consumer, Offset, KafkaClient, Producer, KeyedMessage, ConsumerGroup, ConsumerGroupOptions, Message, HighLevelProducer, CustomPartitionAssignmentProtocol } from 'kafka-node';
import { DispatchService } from './dispatch.service';
import { v1 } from 'uuid';
import { assign } from 'nodemailer/lib/shared';

export interface IPartitionTopic {
    partitions: number;
    lastPartition: number;
}

export interface ITopic {
    topic: string;
    partitionTopic: IPartitionTopic;
}

export class KafkaService {
    public consumer: ConsumerGroup;
    public producer: Producer;
    public offset: Offset;
    public subscribeTopics: Array<string> = [];
    public publishTopics: Array<string> = [];
    private readonly topicTest = 'topic-mitosis';
    private readonly client: KafkaClient = undefined;
    private readonly dispatchService: DispatchService;
    private readonly dynamicTopics: Array<ITopic>;
    constructor() {

        process.env.KAFKA_TOPICS.split(' ').forEach((topic: string) => {
            const topicObj = topic.split('.');
            if (topicObj[1] === 'subscribe') {
                this.subscribeTopics.push(topicObj[0]);
            } else {
                this.publishTopics.push(topicObj[0]);
            }
        });

        this.client = new KafkaClient({ kafkaHost: process.env.KAFKA_HOSTS });
        const ackBatchOptions = { noAckBatchSize: 1024, noAckBatchAge: 10 };
        const cgOptions: ConsumerGroupOptions = {
            kafkaHost: process.env.KAFKA_HOSTS,
            batch: ackBatchOptions,
            groupId: 'groupID',
            id: 'consumerID',
            sessionTimeout: 15000,
            protocol: ["roundrobin"],
            fromOffset: "latest",
            migrateHLC: false,
            migrateRolling: true
        };

        this.consumer = new ConsumerGroup(cgOptions, [this.topicTest]);

        const topics = [this.topicTest];
        const options = { autoCommit: false }; // , fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024

        this.producer = new Producer(this.client, { requireAcks: 1 });
        this.offset = new Offset(this.client);

        this.dispatchService = new DispatchService(this.subscribeTopics);

        if (process.env.NODE_ENV === 'development') {
            this.dispatchService.checkFirstConnection().subscribe((result: boolean) => {
                const topicsToCreate = [
                    { topic: 'topic1', partitions: 5, replicationFactor: 2 },
                    { topic: 'topic2', partitions: 5, replicationFactor: 2 }
                ];
                const idBox = v1();
                this.client.createTopics(topicsToCreate, (error, res) => {
                    const t = 2;
                    this.consumer.addTopics(['topic1', 'topic2'], (err, added) => {
                        const t = 2;
                    });
                });
            });
        }

        const t: CustomPartitionAssignmentProtocol;
        t.name = "toto";
        t.userData = {};
        t.version = 0;
        t.assign({}, {}, (error: any, result: any) => {
            const t = 2;
        });




        const producerBIs = new HighLevelProducer(this.client, { requireAcks: 1, partitionerType: 4 }, (partitions: any, key: any) => {
            // key = key || '0';
            // var index = parseInt(key) % partitions.length;
            // return partitions[index];
            const t = 2;

            return t;
        });

        producerBIs.on('ready', () => {
            setInterval(() => {
                const km = new KeyedMessage('key', 'message');
                const payloads = [
                    { topic: 'topic1', messages: 'test', key: 'test_theKey' },
                    { topic: 'topic2', messages: ['test1', 'test2', km], key: 'test2_theKey' }
                ];

                producerBIs.send(payloads, (err, data) => {
                    console.log(data);
                });
            }, 5000);
        });


        // this.offset.fetch([
        //     { topic: this.topicTest, partition: 0, time: -1, maxNum: 1 }
        // ], function (err, data) {
        //     data
        //     { 't': { '0': [999] } }
        // });
    }

    public getPartition(partitions, key: string): void {
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
        this.consumer.on('offsetOutOfRange', (topic: any) => {
            topic.maxNum = 1;
            this.offset.fetch([topic], (err, offsets) => {
                if (err) {
                    console.log('error', err);
                }
                const min = Math.min(offsets[topic.topic][topic.partition]);
                this.consumer.setOffset(topic.topic, topic.partition, min);
            });
        });
        this.consumer.on('message', (message: Message) => {
            this.dispatchService.routeMessage(message);
        });
        this.consumer.on('error', (err: any) => {
            console.log('error', err);
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
