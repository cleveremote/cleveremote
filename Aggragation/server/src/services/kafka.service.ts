import { map, tap, mergeMap, flatMap, repeatWhen, delay, takeWhile } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, bindCallback } from 'rxjs';
// tslint:disable-next-line:max-line-length
import { Offset, KafkaClient, Producer, ConsumerGroup, ConsumerGroupOptions, Message, HighLevelProducer, CustomPartitionAssignmentProtocol, ClusterMetadataResponse, MetadataResponse, ProduceRequest } from 'kafka-node';
import { DispatchService } from './dispatch.service';
import { v1 } from 'uuid';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../entities/custom.repositories/device.ext";
import { Device } from '../entities/gen.entities/device';
import { Tools } from './tools-service';
import { ITopic } from '../entities/interfaces/entities.interface';

export class KafkaService {
    public static instance: KafkaService;
    public consumers: Array<ConsumerGroup> = [];
    public producer: Producer;
    public offset: Offset;
    public subscribeTopics: Array<ITopic> = [];
    public publishTopics: Array<ITopic> = [];
    private readonly client: KafkaClient = undefined;
    private readonly clientProducer: KafkaClient = undefined;
    constructor() {
        this.client = new KafkaClient({ kafkaHost: process.env.KAFKA_HOSTS });
        this.clientProducer = new KafkaClient({
            connectRetryOptions: {
                retries: 5,
                factor: 0,
                minTimeout: 1000,
                maxTimeout: 1000,
                randomize: true
            },
            idleConnection: 24 * 60 * 60 * 1000,
            kafkaHost: process.env.KAFKA_HOSTS
        });
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
            migrateRolling: true,
            autoCommit: false
        };
    }
    // Offsets to use for new groups other options could be 'earliest' or 'none' (none will emit an error if no offsets were saved)
    // equivalent to Java client's auto.offset.reset
    public createConsumers(clusterMetaData: ClusterMetadataResponse): void {
        this.subscribeTopics.forEach((topic: ITopic) => {
            const topicObject = clusterMetaData.metadata[topic.name];
            if (topicObject) {
                Object.keys(topicObject).forEach((key, index) => {
                    const consumer = new ConsumerGroup(this.setCfgOptions(key, topic), [topic.name]);
                    this.consumers.push(consumer);
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
            //     const dataExample = { entity: 'Account', type: 'UPDATE', data: { account_id: 'server_3', name: 'name12', description: 'description1234' } };
            //     const payloads = [
            //         { topic: 'box_action', messages: JSON.stringify(dataExample), key: 'box_action.server_1' }
            //     ];

            //     this.producer.send(payloads, (err, data) => {
            //         console.log(data);
            //     });
            // }, 100);
            Tools.loginfo('   - init Producer');
            Tools.logSuccess('     => OK');
        });

        return of(true);
    }

    public initializeConsumer(): Observable<boolean> {
        const topics = this.subscribeTopics.map((topic: ITopic) => topic.name);
        const loadMetadataForTopicsObs = bindCallback(this.client.loadMetadataForTopics.bind(this.client, []));
        const result = loadMetadataForTopicsObs();

        return result.pipe(map((results: any) => {
            this.createConsumers(results[1][1]);
            Tools.loginfo('   - init Consumer');
            Tools.logSuccess('     => OK');

            return true;
        }));
    }

    public sendMessage(payloads: Array<ProduceRequest>): Observable<any> {

        const sendObs = bindCallback(this.producer.send.bind(this.producer, payloads));
        const result = sendObs();

        return result.pipe(mergeMap((data: any) => {
            Tools.loginfo('   - message sent => ');
            console.log(data);

            return of(data).pipe(
                mergeMap((x: any) => {
                    const offset = new Offset(this.clientProducer);
                    const offsetObs = bindCallback(offset.fetchCommits.bind(offset, 'partitionedGroup', [
                        { topic: payloads[0].topic, partition: Object.keys(x[1][payloads[0].topic])[0] }
                    ]));
                    // const offsetObs = bindCallback(offset.fetchLatestOffsets.bind(offset,  [
                    //     'aggregator_dbsync']));
                    // const offsetObs = bindCallback(offset.fetchLatestOffsets.bind(offset, ['aggregator_dbsync']));
                    const offsetObservable = offsetObs();

                    return offsetObservable.pipe(mergeMap((results: any) => {
                        // console.log(offsets[topic][partition]);
                        if (!!(results.message || results[0] !== null)) {
                            Tools.logSuccess('     => KO');

                            return of(false);
                        }
                        const offsetRes = results[1][payloads[0].topic][Object.keys(x[1][payloads[0].topic])[0]];
                        const offsetIn = x[1][payloads[0].topic][Object.keys(x[1][payloads[0].topic])[0]];
                        const partitionRes = Object.keys(results[1][payloads[0].topic])[0];
                        const partitionIn = Object.keys(x[1][payloads[0].topic])[0];
                        if ((offsetRes === offsetIn + 1) && partitionRes === partitionIn) {
                            Tools.logSuccess('     => OK ' + 'time = ' + Date() + ' [partitionIn,offsetIn]=[' + partitionIn + ',' + offsetIn + ']' + ' [partitionRes,offsetRes]=[' + partitionRes + ',' + offsetRes + ']');

                            return of(true);
                        }
                        Tools.logSuccess('     => KO ' + 'time = ' + Date() + ' [partitionIn,offsetIn]=[' + partitionIn + ',' + offsetIn + ']' + ' [partitionRes,offsetRes]=[' + partitionRes + ',' + offsetRes + ']');

                        return of(false);
                    }));
                })
            ).pipe(repeatWhen(completed => completed.pipe(delay(1000)))).pipe(takeWhile((value, index) => {
                const t = index;

                return !value && index < 30;
            }, true)).pipe(map((x) => {
                return x;
            }));

        }));
    }

    public init(): Observable<void> {
        return observableOf(true).pipe(
            flatMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION).pipe(
                flatMap(() => this.setPublicationTopics(process.env.KAFKA_TOPICS_PUBLICATION))).pipe(
                    flatMap(() => this.initializeProducer())).pipe(
                        flatMap(() => this.initializeConsumer())).pipe(
                            map(() => {
                                KafkaService.instance = this;
                                Tools.logSuccess('  => OK.');
                            }))
            ));
    }

}
