import { map, tap, mergeMap, flatMap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, bindCallback, from } from 'rxjs';
// tslint:disable-next-line:max-line-length
import { Offset, KafkaClient, Producer, ConsumerGroup, ConsumerGroupOptions, Message, HighLevelProducer, CustomPartitionAssignmentProtocol, ClusterMetadataResponse, MetadataResponse } from 'kafka-node';
import { DispatchService } from './dispatch.service';
import { v1 } from 'uuid';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../entities/custom.repositories/device.ext";
import { Device } from '../entities/gen.entities/device';
import { Tools } from './tools-service';
import { ITopic } from '../entities/interfaces/entities.interface';
import { AccountExt } from '../entities/custom.repositories/account.ext';
import { CustomPartitionnerService } from './customPartitionner.service';

export class KafkaService {
    public static instance: KafkaService;
    public consumers: Array<ConsumerGroup> = [];
    public producer: Producer;
    public offset: Offset;
    public subscribeTopics: Array<ITopic> = [];
    public publishTopics: Array<ITopic> = [];
    private readonly client: KafkaClient = undefined;
    private readonly clientProducer: KafkaClient = undefined;
    private readonly dispatchService: DispatchService;
    private readonly topics: Array<ITopic>;
    public static flag_IsFirstConnection: boolean = false;

    constructor() {
        this.client = new KafkaClient({ idleConnection: 24 * 60 * 60 * 1000, kafkaHost: process.env.KAFKA_HOSTS });
        this.clientProducer = new KafkaClient({ idleConnection: 24 * 60 * 60 * 1000, kafkaHost: process.env.KAFKA_HOSTS });
        this.dispatchService = new DispatchService();
    }

    public setSubscriptionTopics(topicsString: string): Observable<boolean> {
        const deviceRepository = getCustomRepository(DeviceExt);

        return deviceRepository.getDevice().pipe(
            map((currentDevice: Device) => {
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
                const lst = groupMembers.filter((grp) => grp.subscription[0] === topic.name);
                lst.forEach((groupMember, index) => {
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

    public setCfgOptions(patition: string, topic: ITopic, customProtocol: boolean = true): ConsumerGroupOptions {
        const customPartitionner: CustomPartitionnerService = new CustomPartitionnerService(topic);
        return {
            kafkaHost: process.env.KAFKA_HOSTS,
            batch: { noAckBatchSize: 1024, noAckBatchAge: 10 },
            sessionTimeout: 15000,
            groupId: 'partitionedGroup',
            protocol: customProtocol ? customPartitionner.setCustomPartitionner() : ["roundrobin"],
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
                for (let index = topic.partitionTopic.rangePartitions[0]; index <= topic.partitionTopic.rangePartitions[1]; index++) {
                    const consumer = new ConsumerGroup(this.setCfgOptions(index.toString(), topic), [topic.name]);
                    this.consumers.push(consumer);
                }
            }
        });
    }

    public initializeProducer(): Observable<boolean> {
        this.producer = new HighLevelProducer(this.clientProducer, { requireAcks: 1, partitionerType: 2 });

        this.producer.on('ready', () => {
            Tools.loginfo('   - init Producer');
            Tools.logSuccess('     => OK');

            // setInterval(() => {
            //     const payloads = [
            //         { topic: 'aggregator_dbsync', messages: 'test-AGGREGATION', key: 'server_1' }
            //     ];

            //     this.producer.send(payloads, (err, data) => {
            //         console.log(data);
            //     });
            // }, 5000);
        });

        return of(true);
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
        const accountRepository = getCustomRepository(AccountExt);

        return accountRepository.isBoxInitialized().pipe(
            mergeMap((isInitialized: boolean) => {
                if (!isInitialized) {
                    KafkaService.flag_IsFirstConnection = true;
                    Tools.loginfo('* start init first connexion...');
                    const topicName = `${Tools.serialNumber}_init_connexion`;
                    var topicsToCreate = [{ topic: topicName, partitions: 1, replicationFactor: 2 }];
                    this.client.createTopics(topicsToCreate, (error, result) => {
                        if (!error) {
                            Tools.loginfo(`   - init create topic =>${topicName}`);
                            Tools.logSuccess('     => OK');
                        } else {
                            Tools.logError(`     => KO! detail: ${error}`);
                        }
                    });
                    const consumerGrp = new ConsumerGroup(this.setCfgOptions('0', undefined, false), topicName);
                    this.consumers.push(consumerGrp);
                }
                return of(true);
            })
        );
    }

    public init(): Observable<void> {
        return observableOf(true).pipe(
            flatMap(() => this.checkFirstConnexion().pipe(
                flatMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION).pipe(
                    flatMap(() => this.setPublicationTopics(process.env.KAFKA_TOPICS_PUBLICATION))).pipe(
                        flatMap(() => this.initializeProducer())).pipe(
                            flatMap(() => this.initializeConsumer())).pipe(
                                map(() => {
                                    KafkaService.instance = this;
                                    Tools.logSuccess('  => OK.');
                                }))
                ))
            ));
    }

}
