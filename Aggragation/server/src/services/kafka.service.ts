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
    name: string;
    partitionTopic?: IPartitionTopic;
}

export class KafkaService {
    public consumer: Array<ConsumerGroup> = [];
    public producer: Producer;
    public offset: Offset;
    public subscribeTopics: Array<ITopic> = [];
    public publishTopics: Array<ITopic> = [];
    private readonly client: KafkaClient = undefined;
    private readonly dispatchService: DispatchService;
    private readonly topics: Array<ITopic>;

    constructor() {

        process.env.KAFKA_TOPICS_PUBLICATION.split(';').forEach((topic: string) => {
            const topicString = topic.split('.');
            if (topicString[1] && topicString[1] === 'full') {
                this.publishTopics.push({
                    name: topicString[0],
                    partitionTopic: { lastPartition: 0, partitions: -1 }
                });
            } else if (topicString[1] && Number(topicString[1]) > 0) {
                this.publishTopics.push({
                    name: topicString[0],
                    partitionTopic: { lastPartition: 0, partitions: Number(topicString[1]) }
                });
            }
        });

        process.env.KAFKA_TOPICS_SUBSCRIPTION.split(';').forEach((topic: string) => {
            const topicString = topic.split('.');
            if (topicString[1] && topicString[1] === 'full') {
                this.subscribeTopics.push({
                    name: topicString[0],
                    partitionTopic: { lastPartition: 0, partitions: -1 }
                });
            } else if (topicString[1] && Number(topicString[1]) > 0) {
                this.subscribeTopics.push({
                    name: topicString[0],
                    partitionTopic: { lastPartition: 0, partitions: Number(topicString[1]) }
                });
            }
        });

        this.client = new KafkaClient({ kafkaHost: process.env.KAFKA_HOSTS });
        this.dispatchService = new DispatchService(this.subscribeTopics);
    }

    public setCustomPartitionAssignmentProtocol(topic: ITopic): Array<CustomPartitionAssignmentProtocol> {
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

    public createConsumers(globalMetaData: any, topic: ITopic): void {
        if (topic && topic.partitionTopic && topic.partitionTopic.partitions > 0) {
            const cgOptions: ConsumerGroupOptions = {
                kafkaHost: process.env.KAFKA_HOSTS,
                batch: { noAckBatchSize: 1024, noAckBatchAge: 10 },
                groupId: 'groupID',
                sessionTimeout: 15000,
                protocol: this.setCustomPartitionAssignmentProtocol(topic),
                fromOffset: "latest",
                migrateHLC: false,
                migrateRolling: true
            };
            const topicObject = globalMetaData[1].metadata[topic.name];
            if (topicObject) {
                Object.keys(topicObject).forEach((key, index) => {
                    this.consumer.push(new ConsumerGroup({ ...cgOptions, id: `consumer${key}` }, [topic.name]));
                });
            }
        } else if (topic && !topic.partitionTopic) {
            const cgOptions: ConsumerGroupOptions = {
                kafkaHost: process.env.KAFKA_HOSTS,
                batch: { noAckBatchSize: 1024, noAckBatchAge: 10 },
                groupId: 'groupIDFull',
                sessionTimeout: 15000,
                protocol: ["roundrobin"],
                fromOffset: "latest",
                migrateHLC: false,
                migrateRolling: true
            };
            const topicObject = globalMetaData[1].metadata[topic.name];
            if (topicObject) {
                Object.keys(topicObject).forEach((key, index) => {
                    this.consumer.push(new ConsumerGroup({ ...cgOptions, id: `consumer${key}` }, [topic.name]));
                });
            }
        }


    }

    public initializeProducer(): void {

        this.producer = new HighLevelProducer(this.client, { requireAcks: 1, partitionerType: 4 }, (partitions: any, key: any) => {
            const t = 2;

            return 2;
        });

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

        this.producer.on('ready', () => {
            setInterval(() => {
                const payloads = [
                    { topic: 'topic1', messages: 'test1', key: 'test_theKey1' }
                ];

                this.producer.send(payloads, (err, data) => {
                    console.log(data);
                });
            }, 1000);
        });
    }

    public initializeConsumer(): void {
        this.subscribeTopics.forEach(topic => {
            this.client.loadMetadataForTopics([topic.name], (error, results) => {
                console.log('%j', results);
                this.createConsumers(results, topic);
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
