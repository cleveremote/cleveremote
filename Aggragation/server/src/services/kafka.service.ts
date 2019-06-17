import { map, tap, mergeMap, flatMap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, bindCallback } from 'rxjs';
// tslint:disable-next-line:max-line-length
import { Offset, KafkaClient, Producer, ConsumerGroup, ConsumerGroupOptions, Message, HighLevelProducer, CustomPartitionAssignmentProtocol, ClusterMetadataResponse, MetadataResponse } from 'kafka-node';
import { DispatchService } from './dispatch.service';
import { v1 } from 'uuid';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../entities/custom.repositories/device.ext";
import { Device } from '../entities/gen.entities/device';
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
        this.dispatchService = new DispatchService(this);
    }

    public setSubscriptionTopics(topicsString: string): Observable<boolean> {
        topicsString.split(';').forEach((topic: string) => {
            const topicString = topic.split('.');
            if (topicString[1] && topicString[1] === 'full') {
                this.subscribeTopics.push({
                    name: topicString[0]
                });
            }
        });
        Tools.loginfo('   - init Subscription topics');
        Tools.logSuccess('     => OK');

        return of(true);
        // Tools.loginfo('   - init Subscription topics');
        // Tools.logError('      => KO');
    }

    public setPublicationTopics(topicsString: string): Observable<boolean> {
        const cfgTopicBoxArray: Array<any> = [];
        const deviceRepository = getCustomRepository(DeviceExt);

        return deviceRepository.getDevices().pipe(map((devices: Array<Device>) => {
            const t = devices;
            devices.forEach(element => {
                cfgTopicBoxArray.push({
                    // tslint:disable-next-line: max-line-length
                    boxId: element.device_id, startRange: element.partition_configs[0].start_range, endRange: element.partition_configs[0].end_range
                });
            });

            topicsString.split(';').forEach((topic: string) => {
                const topicString = topic.split('.');
                if (topicString[1] && topicString[1] === 'range') {
                    if (cfgTopicBoxArray.length > 0) {
                        cfgTopicBoxArray.forEach(cfg => {
                            this.publishTopics.push({
                                // tslint:disable-next-line: max-line-length
                                box: cfg.boxId, name: topicString[0], partitionTopic: { current: cfg.startRange, rangePartitions: [cfg.startRange, cfg.endRange] }
                            });
                        });
                    }
                }
            });
            Tools.loginfo('   - init Publication topics');
            Tools.logSuccess('     => OK');

            return true;
        }));
    }

    public setCfgOptions(patition: string, topic: ITopic): ConsumerGroupOptions {

        return {
            kafkaHost: process.env.KAFKA_HOSTS,
            batch: { noAckBatchSize: 1024, noAckBatchAge: 10 },
            sessionTimeout: 15000,
            groupId: 'nonePartitionedGroup',
            protocol: ["roundrobin"],
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
        // tslint:disable-next-line:max-line-length
        this.producer = new HighLevelProducer(this.clientProducer, { requireAcks: 1, partitionerType: 4 }, (partitions: any, key: any) => {
            const keyData = key.split('.');

            if (keyData === 'init-connexion') {
                return 0;
            }

            const topicData = this.publishTopics.find((topic: ITopic) => topic.name === keyData[0] && topic.box === keyData[1]);
            let partition = 0;
            // traitement speciale pour le init-connexion;
            if (topicData.partitionTopic.current > topicData.partitionTopic.rangePartitions[1]) {
                topicData.partitionTopic.current = topicData.partitionTopic.rangePartitions[0];
            }

            partition = topicData.partitionTopic.current;
            topicData.partitionTopic.current++;

            return partition;
        });

        this.producer.on('ready', () => {
            // setInterval(() => {
            //     const payloads = [
            //         { topic: 'box_action', messages: 'test-AGGREGATION', key: 'box_action.server_1' }
            //     ];

            //     this.producer.send(payloads, (err, data) => {
            //         console.log(data);
            //     });
            // }, 5000);
            Tools.loginfo('   - init Producer');
            Tools.logSuccess('     => OK');
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

    public init(): Observable<void> {
        return observableOf(true).pipe(
            flatMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION).pipe(
                flatMap(() => this.setPublicationTopics(process.env.KAFKA_TOPICS_PUBLICATION))).pipe(
                    flatMap(() => this.initializeProducer())).pipe(
                        flatMap(() => this.initializeConsumer())).pipe(
                            map(() => {
                                Tools.logSuccess('  => OK.');
                            }))
            ));
    }

}
