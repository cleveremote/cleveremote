import { map, tap, mergeMap, flatMap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, bindCallback, from } from 'rxjs';
// tslint:disable-next-line:max-line-length
import { Offset, KafkaClient, Producer, ConsumerGroup, ConsumerGroupOptions, Message, HighLevelProducer, CustomPartitionAssignmentProtocol, ClusterMetadataResponse, MetadataResponse } from 'kafka-node';
import { DispatchService } from './dispatch.service';
import { v1 } from 'uuid';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../entities/custom.repositories/device.ext";
import { device } from '../entities/gen.entities/device';
import { Tools } from './tools-service';
import { ITopic } from '../entities/interfaces/entities.interface';

export class KafkaService {
    public producer: Producer;
    public offset: Offset;
    public subscribeTopics: Array<ITopic> = [];
    public publishTopics: Array<ITopic> = [];
    private readonly client: KafkaClient = undefined;
    private readonly clientProducer: KafkaClient = undefined;
    private readonly dispatchService: DispatchService;
    private readonly topics: Array<ITopic>;

    constructor() {
        this.client = new KafkaClient({ kafkaHost: process.env.KAFKA_HOSTS });
        this.clientProducer = new KafkaClient({ kafkaHost: process.env.KAFKA_HOSTS });
        this.dispatchService = new DispatchService(this.subscribeTopics);
    }



    public getSerialNumber(): Observable<void> {
        // tslint:disable-next-line: no-require-imports
        const util = require('util');
        // tslint:disable-next-line: no-require-imports
        return from(util.promisify(require('child_process').exec)('ls')).pipe(
            map((x: any) => {
                const { stdout, stderr } = x;
                console.log('stdout:', stdout);
                console.log('stderr:', stderr);
            })
        );

    }

    public setSubscriptionTopics(topicsString: string): Observable<boolean> {
        const deviceRepository = getCustomRepository(DeviceExt);

        return deviceRepository.getDevice().pipe(
            map((currentDevice: device) => {
                topicsString.split(';').forEach((topic: string) => {
                    const topicString = topic.split('.');
                    if (topicString[1] && topicString[1] === 'range') {
                        const cfg = currentDevice.partition_configs[0];
                        this.subscribeTopics.push({
                            name: topicString[0],
                            partitionTopic: {
                                current: cfg.start_range,
                                rangePartitions: [cfg.start_range, cfg.end_range]
                            }
                        });
                    }
                });
                Tools.loginfo('   - init Subscription topics');
                Tools.logSuccess('     => OK');

                return true;
            }));
    }

    public setPublicationTopics(topicsString: string): Observable<boolean> {
        const cfgTopicBoxArray: Array<any> = [];

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

        return {
            kafkaHost: process.env.KAFKA_HOSTS,
            batch: { noAckBatchSize: 1024, noAckBatchAge: 10 },
            sessionTimeout: 15000,
            groupId: 'partitionedGroup',
            protocol: this.setCustomPartitionAssignmentProtocol(topic),
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

    public initializeProducer(): Observable<boolean> {
        this.producer = new HighLevelProducer(this.clientProducer, { requireAcks: 1, partitionerType: 2 });

        this.producer.on('ready', () => {
            Tools.loginfo('   - init Producer');
            Tools.logSuccess('     => OK');

            setInterval(() => {
                const payloads = [
                    { topic: 'aggregator_dbsync', messages: 'test-AGGREGATION', key: 'server_1' }
                ];

                this.producer.send(payloads, (err, data) => {
                    console.log(data);
                });
            }, 5000);
        });

        return of(true);
    }

    public setConsumerListener(consumer: ConsumerGroup): void {
        consumer.on('offsetOutOfRange', (topic: any) => {
            topic.maxNum = 1;
            this.offset.fetch([topic], (err, offsets) => {
                if (err) {
                    Tools.logError('error', err);
                }
                const min = Math.min(offsets[topic.topic][topic.partition]);
                consumer.setOffset(topic.topic, topic.partition, min);
            });
        });
        consumer.on('message', (message: Message) => {
            this.dispatchService.routeMessage(consumer, message);
        });
        consumer.on('error', (err: any) => {
            Tools.logError('error', err);
        });
    }

    public initializeConsumer(): Observable<boolean> {
        const topics = this.subscribeTopics.map((topic: ITopic) => topic.name);
        const loadMetadataForTopicsObs = bindCallback(this.client.loadMetadataForTopics.bind(this.client, topics));
        const result = loadMetadataForTopicsObs();

        return result.pipe(map((results: any) => {
            this.createConsumers(results[1][1]);
            Tools.loginfo('   - init Consumer');
            Tools.logSuccess('     => OK');

            return true;
        }));
    }

    public checkFirstConnexion(): Observable<boolean> {

        return this.dispatchService.checkFirstConnection().pipe(
            map((isFirstConnexion: boolean) => {
                if (isFirstConnexion) {
                    // create Topic init_cnx_v1 where v1 is the id of the topic
                    // create consumer for this topic 
                    // send server aggregator_init_connexion
                    // params v1  
                }

                return true;
            }));
    }

    public init(): Observable<void> {
        return observableOf(true).pipe(
            flatMap(() => this.checkFirstConnexion().pipe(
                flatMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION).pipe(
                    flatMap(() => this.setPublicationTopics(process.env.KAFKA_TOPICS_PUBLICATION))).pipe(
                        flatMap(() => this.initializeProducer())).pipe(
                            flatMap(() => this.initializeConsumer())).pipe(
                                map(() => {
                                    Tools.logSuccess('  => OK.');
                                }))
                ))
            ));
    }

}
