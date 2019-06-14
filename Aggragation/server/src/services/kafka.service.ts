import { map, tap, mergeMap, flatMap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, bindCallback } from 'rxjs';
// tslint:disable-next-line:max-line-length
import { Offset, KafkaClient, Producer, ConsumerGroup, ConsumerGroupOptions, Message, HighLevelProducer, CustomPartitionAssignmentProtocol, ClusterMetadataResponse, MetadataResponse } from 'kafka-node';
import { DispatchService } from './dispatch.service';
import { v1 } from 'uuid';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../entities/custom.repositories/device.ext";
import { device } from '../entities/gen.entities/device';

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
        this.client = new KafkaClient({ kafkaHost: process.env.KAFKA_HOSTS });
        this.dispatchService = new DispatchService(this.subscribeTopics);
    }

    public setSubscriptionTopics(topicsString: string): Observable<boolean> {
        if (process.env.NODE_ENV === 'development') {
            topicsString.split(';').forEach((topic: string) => {
                const topicString = topic.split('.');
                if (topicString[1] && topicString[1] === 'full') {
                    this.subscribeTopics.push({
                        name: topicString[0]
                    });
                }
            });

            return of(true);
        }

        if (process.env.NODE_ENV === 'BOX') {
            const deviceRepository = getCustomRepository(DeviceExt);

            return deviceRepository.getDevice().pipe(map((currentDevice: device) => {
                topicsString.split(';').forEach((topic: string) => {
                    const topicString = topic.split('.');
                    if (topicString[1] && Number(topicString[1]) > 0) {
                        const cfg = currentDevice.config;
                        this.subscribeTopics.push({
                            name: topicString[0],
                            partitionTopic: {
                                current: cfg.start_range,
                                rangePartitions: [cfg.start_range, cfg.end_range]
                            }
                        });
                    }
                });

                return true;
            }));
        }

        return of(false);
    }

    public setPublicationTopics(topicsString: string): Observable<boolean> {
        const cfgTopicBoxArray: Array<any> = [];
        if (process.env.NODE_ENV === 'development') {
            const deviceRepository = getCustomRepository(DeviceExt);

            return deviceRepository.getDevices().pipe(map((devices: Array<device>) => {
                const t = devices;
                devices.forEach(element => {
                    const cfgTopicBox = {
                        boxId: element.device_id,
                        startRange: element.config.start_range,
                        endRange: element.config.end_range
                    };
                    cfgTopicBoxArray.push(cfgTopicBox);
                });

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
                    }
                });

                return true;

            }));
        }
        if (process.env.NODE_ENV === 'BOX') {
            topicsString.split(';').forEach((topic: string) => {
                const topicString = topic.split('.');
                if (topicString[1] && topicString[1] === 'full') {
                    this.publishTopics.push({
                        name: topicString[0]
                    });
                }
            });

            return of(true);
        }

        return of(false);
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

    public createConsumers(clusterMetaData: ClusterMetadataResponse): void {
        this.subscribeTopics.forEach((topic: ITopic) => {
            const topicObject = clusterMetaData.metadata[topic.name];
            if (topicObject) {
                Object.keys(topicObject).forEach((key, index) => {
                    const consumer = new ConsumerGroup(this.setCfgOptions(key, topic), [topic.name]);
                    this.setConsumerListener(consumer);
                });
            }
        });
    }

    public initializeProducer(): void {
        if (process.env.NODE_ENV === 'development') {
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
        } else if (process.env.NODE_ENV === 'BOX') {
            this.producer = new HighLevelProducer(this.client, { requireAcks: 1, partitionerType: 2 });
        }




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
                    { topic: 'aggregator_dbsync', messages: 'test1', key: 'server_1' }
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

    public initializeConsumer(): Observable<boolean> {


        const topics = this.subscribeTopics.map((topic: ITopic) => topic.name);
        const loadMetadataForTopicsObs = bindCallback(this.client.loadMetadataForTopics.bind(this.client, topics));
        const result = loadMetadataForTopicsObs();

        return result.pipe(map((results: any) => {
            console.log('%j', results);
            this.createConsumers(results[1][1]);

            return true;
        }));



        // this.client.loadMetadataForTopics(topics, (error, results) => {
        //     console.log('%j', results);
        //     this.createConsumers(results[1]);
        // });

        // return of(true);
    }

    public init(): Observable<void> {
        return this.initListners();
    }

    public initListners(): Observable<void> {
        console.log('* start init kafka...');

        return observableOf(true).pipe(
            flatMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION).pipe(
                flatMap(() => this.setPublicationTopics(process.env.KAFKA_TOPICS_PUBLICATION))
            ).pipe(
                flatMap(() => this.initializeConsumer().pipe(
                    tap((result: any) => {
                        const t = 2;
                        this.initializeProducer();
                        console.log('* init kafka OK');
                    }))
                ))
            ));
    }

}
