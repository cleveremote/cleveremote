import { map, tap, mergeMap, flatMap, merge, take, repeatWhen, takeUntil, delay, takeWhile, repeat, retryWhen } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable, bindCallback, from, interval, Subject } from 'rxjs';
// tslint:disable-next-line:max-line-length
import { Offset, KafkaClient, ConsumerGroupOptions, HighLevelProducer, CustomPartitionAssignmentProtocol, ClusterMetadataResponse, ConsumerGroupStream, ProduceRequest, ProducerStream } from 'kafka-node';
import { DispatchService } from './dispatch.service';
import { v1 } from 'uuid';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../entities/custom.repositories/device.ext";
import { Device } from '../entities/gen.entities/device';
import { Tools } from './tools-service';
import { ITopic } from '../entities/interfaces/entities.interface';
import { AccountExt } from '../entities/custom.repositories/account.ext';
import { CustomPartitionnerService } from './customPartitionner.service';
import { genericRetryStrategy } from './tools/generic-retry-strategy';

export class KafkaService {
    public static flagIsFirstConnection = false;
    public static instance: KafkaService;
    public consumers: Array<ConsumerGroupStream> = [];
    public producer: ProducerStream;
    public offset: Offset;
    public subscribeTopics: Array<ITopic> = [];
    public publishTopics: Array<ITopic> = [];
    public reconnectInterval: any;
    private client: KafkaClient = undefined;
    private clientProducer: KafkaClient = undefined;
    private readonly dispatchService: DispatchService;
    private readonly topics: Array<ITopic>;

    constructor() {
        this.InitAndHandleFails();
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
        Tools.loginfo('   - init Publication topics');
        Tools.logSuccess('     => OK');

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
            migrateRolling: true,
            autoCommit: false
        };
    }

    public createConsumers(clusterMetaData: ClusterMetadataResponse): void {
        this.subscribeTopics.forEach((topic: ITopic) => {
            const topicObject = clusterMetaData.metadata[topic.name];
            if (topicObject) {
                for (let index = topic.partitionTopic.rangePartitions[0]; index <= topic.partitionTopic.rangePartitions[1]; index++) {
                    const consumer = new ConsumerGroupStream(this.setCfgOptions(index.toString(), topic), [topic.name]);
                    this.consumers.push(consumer);
                }
            }
        });
    }

    public initializeProducer(): Observable<boolean> {
        const loadMetadataForTopicsObs = bindCallback(this.producer.on.bind(this.clientProducer, 'ready'));
        const result = loadMetadataForTopicsObs();
        if ((this.producer as any).ready) {
            setInterval(() => {
                const dataExample = { entity: 'Account', type: 'UPDATE', data: { account_id: 'server_3', name: 'name12', description: 'description1234' } };
                const payloads = [
                    { topic: 'aggregator_dbsync', messages: JSON.stringify(dataExample), key: 'server_1' }
                ];

                // this.sendMessage(payloads).subscribe();
            }, 5000);
            Tools.loginfo('   - init Producer');
            Tools.logSuccess('     => OK');

            return of(true);
        }

        return result.pipe(map((results: any) => {
            if (this.reconnectInterval) {
                clearTimeout(this.reconnectInterval);
                this.reconnectInterval = undefined;
            }
            setInterval(() => {
                const dataExample = { entity: 'Account', type: 'UPDATE', data: { account_id: 'server_3', name: 'name12', description: 'description1234' } };
                const payloads = [
                    { topic: 'aggregator_dbsync', messages: JSON.stringify(dataExample), key: 'server_1' }
                ];

                // this.sendMessage(payloads).subscribe();
            }, 5000);
            Tools.loginfo('   - init Producer');
            Tools.logSuccess('     => OK');

            return true;
        }));
    }

    public initializeConsumer(): Observable<boolean> {
        const topics = this.subscribeTopics.map((topic: ITopic) => topic.name);
        const loadMetadataForTopicsObs = bindCallback(this.client.loadMetadataForTopics.bind(this.client, topics));
        const result = loadMetadataForTopicsObs();

        return result.pipe(map((results: any) => {
            if (results && results[1] && results[1][1]) {
                this.createConsumers(results[1][1]);
                Tools.loginfo('   - init Consumer');
                Tools.logSuccess('     => OK');

                return true;
            }

            Tools.loginfo('   - init Consumer');
            Tools.logSuccess('     => KO');

            return true;
        }));
    }

    public checkFirstConnexion(): Observable<boolean> {

        return of(true);
    }

    public init(): Observable<void> {
        try {
            return observableOf(true).pipe(
                flatMap(() => this.checkFirstConnexion().pipe(
                    flatMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION).pipe(
                        flatMap(() => this.setPublicationTopics(process.env.KAFKA_TOPICS_PUBLICATION))).pipe(
                            // flatMap(() => this.initializeProducer())).pipe(
                            flatMap(() => this.initializeConsumer())).pipe(
                                map(() => {
                                    KafkaService.instance = this;
                                    Tools.logSuccess('  => OK.');
                                }))
                    ))
                ));

        } catch (error) {
            console.log("test error");

        }
    }
    public initializeCLients(): void {

        this.client = new KafkaClient({
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


        const cfgOption = {
            kafkaClient: {
                connectRetryOptions: {
                    retries: 5,
                    factor: 0,
                    minTimeout: 1000,
                    maxTimeout: 1000,
                    randomize: true
                },
                idleConnection: 24 * 60 * 60 * 1000,
                kafkaHost: process.env.KAFKA_HOSTS
            },
            producer: { requireAcks: 1, partitionerType: 2 }
        };


        this.producer = new ProducerStream(cfgOption);

        const loadMetadataForTopicsObs = bindCallback(this.producer.on.bind(this.clientProducer, 'ready'));
        const result = loadMetadataForTopicsObs();
        if ((this.producer as any).ready) {
            if (this.reconnectInterval) {
                clearTimeout(this.reconnectInterval);
                this.reconnectInterval = undefined;
            }
            Tools.loginfo('   - init Producer');
            Tools.logSuccess('     => OK');
        }

        result.pipe(map((results: any) => {
            Tools.loginfo('   - init Producer');
            Tools.logSuccess('     => OK');
            if (this.reconnectInterval) {
                clearTimeout(this.reconnectInterval);
                this.reconnectInterval = undefined;
            }
            setInterval(() => {
                const dataExample = {
                    entity: 'Account', type: 'UPDATE',
                    data: { account_id: 'server_3', name: 'name12', description: 'description1234' }
                };
                const payloads = [
                    { topic: 'aggregator_dbsync', messages: JSON.stringify(dataExample), key: 'server_1' }
                ];

                // this.sendMessage(payloads).subscribe();
            }, 5000);
            Tools.loginfo('   - init Producer');
            Tools.logSuccess('     => OK');

            return true;
        })).subscribe();
    }
    public InitAndHandleFails(): void {
        const timeToRetryConnection = 12 * 1000; // 12 seconds
        this.reconnectInterval = undefined;
        this.initializeCLients();

        this.producer.on('error', (err: any) => {
            console.info("error reconnect is called in producer error event");
            this.producer.close();
            this.client.close();
            this.clientProducer.close(); // Comment out for client on close
            if (!this.reconnectInterval) { // Multiple Error Events may fire, only set one connection retry.
                this.reconnectInterval =
                    setTimeout(() => {
                        console.info("reconnect is called in producer error event");
                        this.InitAndHandleFails();
                    }, timeToRetryConnection);
            }
        });

        this.client.on('error', (err: any) => {
            console.info("error reconnect is called in client error event");
            this.producer.close();
            this.client.close();
            this.clientProducer.close();
            if (!this.reconnectInterval) { // Multiple Error Events may fire, only set one connection retry.
                this.reconnectInterval =
                    setTimeout(() => {
                        console.info("reconnect is called in client error event");
                        this.InitAndHandleFails();
                    }, timeToRetryConnection);
            }
        });

        this.clientProducer.on('error', (err: any) => {
            console.info("error reconnect is called in clientProducer error event");
            this.producer.close();
            this.client.close();
            this.clientProducer.close();
            if (!this.reconnectInterval) { // Multiple Error Events may fire, only set one connection retry.
                this.reconnectInterval =
                    setTimeout(() => {
                        console.info("reconnect is called in clientProducer error event");
                        this.InitAndHandleFails();
                    }, timeToRetryConnection);
            }
        });
    }


    public sendMessage(payloads: Array<ProduceRequest>): Observable<any> {


        const sendObs = bindCallback(this.producer.sendPayload.bind(this.producer, payloads));
        const result = sendObs();

        return result.pipe(mergeMap((data: any) => {
            Tools.loginfo('   - message sent => ');
            console.log(data);

            return of(data);

        }));
    }

    public checkReponseMessage(data: any): Observable<any> {

        return of(data).pipe(
            mergeMap((x: any) => {
                const t = 2;

                const topicInfo = Object.keys(data[1])[0];
                const offset = new Offset(this.clientProducer);
                const offsetObs = bindCallback(offset.fetchCommits.bind(offset, 'nonePartitionedGroup', [
                    { topic: topicInfo, partition: Object.keys(data[1][topicInfo])[0] }
                ]));
                const offsetObservable = offsetObs();

                return offsetObservable.pipe(
                    map((results: any) => {
                        // console.log(offsets[topic][partition]);
                        if (!!(results.message || results[0] !== null)) {
                            Tools.logSuccess('     => KO');

                            throw false;
                        }
                        const offsetRes = results[1][topicInfo][Object.keys(data[1][topicInfo])[0]];
                        const offsetIn = data[1][topicInfo][Object.keys(data[1][topicInfo])[0]];
                        const partitionRes = Object.keys(results[1][topicInfo])[0];
                        const partitionIn = Object.keys(data[1][topicInfo])[0];
                        if ((offsetRes >= offsetIn + 1) && partitionRes === partitionIn) {
                            Tools.logSuccess('     => OK ' + 'time = ' + Date() + ' [partitionIn,offsetIn]=[' + partitionIn + ',' + offsetIn + ']' + ' [partitionRes,offsetRes]=[' + partitionRes + ',' + offsetRes + ']');

                            return { pin: partitionIn, oin: offsetIn };
                        }
                        Tools.logSuccess('     => KO ' + 'time = ' + Date() + ' [partitionIn,offsetIn]=[' + partitionIn + ',' + offsetIn + ']' + ' [partitionRes,offsetRes]=[' + partitionRes + ',' + offsetRes + ']');

                        throw false;
                    })
                );
            }),
            retryWhen(genericRetryStrategy({
                durationBeforeRetry: 10,
                maxRetryAttempts : 800
              }))
        );
    }

}
