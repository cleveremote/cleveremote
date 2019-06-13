import { map, tap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable } from 'rxjs';
// tslint:disable-next-line:max-line-length
import { Offset, KafkaClient, Producer, ConsumerGroup, ConsumerGroupOptions, Message, HighLevelProducer, CustomPartitionAssignmentProtocol } from 'kafka-node';
import { DispatchService } from './dispatch.service';
import { v1 } from 'uuid';

export interface IPartitionTopic {
    rangePartitions: Array<number>;
    current: number;
}

export interface ITopic {
    box?: string;
    name: string;
    partitionTopic?: IPartitionTopic;
}

export class KafkaService {
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
                    name: topicString[0]
                });
            } else if (topicString[1] && Number(topicString[1]) > 0) {
                // get range from dataBase case boxs. examlple
                const start = 0;
                const end = 1;
                //
                this.publishTopics.push({
                    name: topicString[0],
                    partitionTopic: { current: start, rangePartitions: [start, end] }
                });
            }
        });

        this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION);

        this.client = new KafkaClient({ kafkaHost: process.env.KAFKA_HOSTS });
        this.dispatchService = new DispatchService(this.subscribeTopics);
    }

    public setSubscriptionTopics(topicsString: string): void {
        topicsString.split(';').forEach((topic: string) => {
            const topicString = topic.split('.');
            if (topicString[1] && topicString[1] === 'full') {
                this.subscribeTopics.push({
                    name: topicString[0]
                });
                // this for box case
            } else if (topicString[1] && Number(topicString[1]) > 0) {
                // get range from dataBase case boxs. examlple
                const start = 0;
                const end = 1;
                //
                this.publishTopics.push({
                    name: topicString[0],
                    partitionTopic: { current: start, rangePartitions: [start, end] }
                });
            }
        });
    }

    public setPublicationTopics(topicsString: string): void {
        const cfgTopicBoxArray: Array<any> = [];
        if (process.env.NODE_ENV === 'development') {
            // get all boxes && build array of ITopics
            const cfgTopicBox = { boxId: "device-id", startRange: 0, endRange: 1 };
            cfgTopicBoxArray.push(cfgTopicBox);
        }

        topicsString.split(';').forEach((topic: string) => {
            const topicString = topic.split('.');
            if (topicString[1] && topicString[1] === 'range') {
                if (cfgTopicBoxArray.length > 0) {
                    cfgTopicBoxArray.forEach(cfg => {
                        this.publishTopics.push({
                            box: cfg.boxId,
                            name: topicString[0],
                            partitionTopic: { current: cfg.startRange, rangePartitions: [cfg.startRange, cfg.endRange] }
                        });
                    });

                }


                // this for box case
            } else if (topicString[1] && Number(topicString[1]) > 0) {
                // get range from dataBase case boxs. examlple
                const start = 0;
                const end = 1;
                //
                this.publishTopics.push({
                    name: topicString[0],
                    partitionTopic: { current: start, rangePartitions: [start, end] }
                });
            }
        });
    }

    // this function is for box consumers
    public setCustomPartitionAssignmentProtocol(topic: ITopic): Array<CustomPartitionAssignmentProtocol> {
        const customPartitionAssignmentProtocol: CustomPartitionAssignmentProtocol = {
            name: "customProtocol",
            version: 0,
            userData: {},
            assign: (topicPartition: any, groupMembers: any, cb: (error: any, result: any) => void) => {
                const ret: Array<any> = [];
                groupMembers.forEach((groupMember, index) => {
                    const cfg = {} as any;
                    cfg.memberId = groupMember.id;
                    cfg.topicPartitions = {} as any;
                    cfg.topicPartitions[topic.name] = [index];
                    cfg.version = 0;
                    ret.push(cfg);
                });
                cb(undefined, ret);
            }
        };

        return [customPartitionAssignmentProtocol];
    }

    public setCfgOptions(patition: string, topic: ITopic): ConsumerGroupOptions {
        const hasPartitions: boolean = topic.partitionTopic && topic.partitionTopic.rangePartitions.length > 0;
        const hasNoPartitions: boolean = (!topic.partitionTopic);

        if (!(topic && hasPartitions || hasNoPartitions)) {
            return undefined;
        }

        return {
            kafkaHost: process.env.KAFKA_HOSTS,
            batch: { noAckBatchSize: 1024, noAckBatchAge: 10 },
            sessionTimeout: 15000,
            groupId: topic && hasPartitions ? 'partitionedGroup' : 'nonePartitionedGroup',
            protocol: topic && hasPartitions ? this.setCustomPartitionAssignmentProtocol(topic) : ["roundrobin"],
            id: `consumer${patition}`,
            fromOffset: "latest",
            migrateHLC: false,
            migrateRolling: true
        };
    }

    public createConsumers(globalMetaData: any, topic: ITopic): void {
        const topicObject = globalMetaData[1].metadata[topic.name];
        if (topicObject) {
            Object.keys(topicObject).forEach((key, index) => {
                const consumer = new ConsumerGroup(this.setCfgOptions(key, topic), [topic.name]);
                this.setConsumerListener(consumer);
            });
        }
    }

    public initializeProducer(): void {
        this.producer = new HighLevelProducer(this.client, { requireAcks: 1, partitionerType: 4 }, (partitions: any, key: any) => {
            const topicData = this.publishTopics.find((topic: ITopic) => topic.box === key);
            let partition = 0;

            if (topicData.partitionTopic.current > topicData.partitionTopic.rangePartitions[1]) {
                topicData.partitionTopic.current = topicData.partitionTopic.rangePartitions[0];
            }

            partition = topicData.partitionTopic.current;
            topicData.partitionTopic.current++;

            return partition;
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
                    { topic: 'aggregator_dbsync', messages: 'test1', key: 'test_theKey1' }
                ];

                this.producer.send(payloads, (err, data) => {
                    console.log(data);
                });
            }, 1000);
        });
    }
    public setConsumerListener(consumer: ConsumerGroup): void {
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
            this.dispatchService.routeMessage(consumer, message);
        });
        consumer.on('error', (err: any) => {
            console.log('error', err);
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
