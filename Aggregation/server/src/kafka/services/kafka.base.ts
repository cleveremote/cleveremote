import { map, tap, mergeMap, flatMap, retryWhen, publish, publishReplay } from 'rxjs/operators';
import { Observable, of, observable, bindCallback, fromEvent, ConnectableObservable } from 'rxjs';
import { Offset, KafkaClient, ConsumerGroupOptions, ClusterMetadataResponse, ConsumerGroupStream, ProduceRequest, ProducerStream, KafkaClientOptions, Message } from 'kafka-node';
import { getCustomRepository } from "typeorm";
import { DeviceExt } from "../../manager/repositories/device.ext";
import { DeviceEntity } from '../../manager/entities/device.entity';
import { Tools } from '../../common/tools-service';
import { ITopic } from '../../manager/interfaces/entities.interface';
import { genericRetryStrategy } from '../../common/generic-retry-strategy';
import { v1 } from 'uuid';
import { ConsumerCustom } from '../classes/consumer.custom.class';
import { IPartitionConfig } from '../interfaces/partition.config.interface';

export class KafkaBase {
    public consumers: Array<ConsumerCustom> = [];
    public producer: ProducerStream;
    public offset: Offset;
    public subscribeTopics: Array<ITopic> = [];
    public publishTopics: Array<ITopic> = [];
    public arrayOfResponse: Array<any> = [];
    public reconnectInterval: any;
    public client: KafkaClient = undefined;
    public clientProducer: KafkaClient = undefined;

    public InitClients(): Observable<boolean> {

        return this.initializeCLients();
    }

    public setCheckhError(): Observable<boolean> {
        const timeToRetryConnection = Number(process.env.KAFKA_TIME_TO_RETRY_CONNECT); // 12 seconds
        this.reconnectInterval = undefined;

        this.producer.on('error', (err: any) => {
            console.info("error reconnect is called in producer error event");
            this.producer.close();
            this.client.close();
            this.clientProducer.close(); // Comment out for client on close
            if (!this.reconnectInterval) { // Multiple Error Events may fire, only set one connection retry.
                this.reconnectInterval =
                    setTimeout(() => {
                        console.info("reconnect is called in producer error event");
                        this.InitClients(); //todo Pipe
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
                        this.InitClients();
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
                        this.InitClients();
                    }, timeToRetryConnection);
            }
        });
        return of(true);

    }

    public setSubscriptionTopics(): Observable<boolean> {
        const topicsString: string = process.env.KAFKA_TOPICS_SUBSCRIPTION;
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

    public setPublicationTopics(devicesConfig: Array<IPartitionConfig>): Observable<boolean> {
        const topicsString: string = process.env.KAFKA_TOPICS_PUBLICATION;
        const cfgTopicBoxArray = devicesConfig;

        topicsString.split(';').forEach((topic: string) => {
            const topicString = topic.split('.');
            if (topicString[1] && topicString[1] === 'range') {
                if (cfgTopicBoxArray.length > 0) {
                    cfgTopicBoxArray.forEach(cfg => {
                        this.publishTopics.push({
                            box: cfg.deviceId, name: topicString[0], partitionTopic: { current: cfg.startRange, rangePartitions: [cfg.startRange, cfg.endRange] }
                        });
                    });
                }
            }
        });

        return of(true);
    }

    public setCfgOptions(patition: string, topic: ITopic): ConsumerGroupOptions {

        return {
            kafkaHost: process.env.KAFKA_HOSTS,
            batch: { noAckBatchSize: Number(process.env.NO_ACK_BATCH_SIZE), noAckBatchAge: Number(process.env.NO_ACK_BATCH_AGE) },
            sessionTimeout: Number(process.env.SESSION_TIMEOUT),
            groupId: process.env.GROUPID,
            protocol: [process.env.PROTOCOL as any],
            id: `consumer${patition}`,
            fromOffset: process.env.PROTOCOLFROM_OFFSET as any,
            migrateHLC: !!+process.env.MIGRATE_HLC,
            migrateRolling: !!+process.env.MIGRATE_ROLLING,
            autoCommit: !!+process.env.AUTO_COMMIT
        };
    }

    public createConsumers(clusterMetaData: ClusterMetadataResponse): void {
        this.subscribeTopics.forEach((topic: ITopic) => {
            const topicObject = clusterMetaData.metadata[topic.name];
            if (topicObject) {
                Object.keys(topicObject).forEach((key, index) => {
                    const consumer = new ConsumerGroupStream(this.setCfgOptions(key, topic), [topic.name]);
                    consumer.on('error', (err: any) => {
                        Tools.logError(`error on consumerGroupStream`, err);
                        // handle a broker not available error
                        if (err && err.name === "BrokerNotAvailableError") {
                            Tools.loginfo("attempting reconnect");
                            consumer.client.refreshMetadata([topic.name], (err: any) => {
                                // handle errors here
                            });
                        } else {
                            Tools.logError(err.stack);
                        }
                    });

                    const myConnectableObservable: ConnectableObservable<Message> = fromEvent(consumer, 'data').pipe(publish()) as ConnectableObservable<Message>;
                    const consumerCustom = new ConsumerCustom();
                    consumerCustom.consumer = consumer;
                    consumerCustom.eventData = myConnectableObservable;
                    consumerCustom.eventData.connect();
                    this.consumers.push(consumerCustom);
                });
            }
        });
    }

    public initializeConsumer(): Observable<boolean> {
        const topics = this.subscribeTopics.map((topic: ITopic) => topic.name);
        const loadMetadataForTopicsObs = bindCallback(this.client.loadMetadataForTopics.bind(this.client, []));
        const result = loadMetadataForTopicsObs();

        return result.pipe(map((results: any) => {
            this.createConsumers(results[1][1]);
            Tools.loginfo('   - init Consumer');
            Tools.logSuccess('     => OK');
            Tools.logSuccess('  => OK.');

            return true;
        }));
    }

    public initializeCLients(): Observable<boolean> {
        const config: KafkaClientOptions = {
            connectRetryOptions: { retries: Number(process.env.RETRIES), factor: Number(process.env.FACTOR), minTimeout: Number(process.env.MINTIMEOUT), maxTimeout: Number(process.env.MAXTIMEOUT), randomize: !!+process.env.RANDOMIZE },
            idleConnection: Number(process.env.IDLECONNECTION),
            kafkaHost: process.env.KAFKA_HOSTS
        };

        const cfgOption = {
            kafkaClient: config,
            producer: {
                requireAcks: 1, partitionerType: 4, customPartitioner: (partitions: any, key: any) => {
                    const keyData = key.split('.');

                    if (keyData[0] === 'init-connexion') {
                        return 0;
                    }

                    const topicData = this.publishTopics.find((topic: ITopic) => topic.name === keyData[0] && topic.box === keyData[1]);
                    let partition = 0;
                    if (topicData.partitionTopic.current > topicData.partitionTopic.rangePartitions[1]) {
                        topicData.partitionTopic.current = topicData.partitionTopic.rangePartitions[0];
                    }

                    partition = topicData.partitionTopic.current;
                    topicData.partitionTopic.current++;

                    return partition;
                }
            }
        };


        this.client = new KafkaClient(config);
        this.clientProducer = new KafkaClient(config);
        this.producer = new ProducerStream(cfgOption);

        if ((this.producer as any).ready) {
            if (this.reconnectInterval) {
                clearTimeout(this.reconnectInterval);
                this.reconnectInterval = undefined;
            }
            Tools.loginfo('   - init Producer');
            Tools.logSuccess('     => OK');
        }


        const loadMetadataForTopicsObs = bindCallback(this.producer.on.bind(this.clientProducer, 'ready'));
        return loadMetadataForTopicsObs().pipe(map((results: any) => {
            if (this.reconnectInterval) {
                clearTimeout(this.reconnectInterval);
                this.reconnectInterval = undefined;
            }
            return true;
        }));
    }

    // public init(): Observable<boolean> {
    //     return of(true).pipe(
    //         flatMap(() => of(this.InitClients()).pipe(
    //             flatMap(() => this.setSubscriptionTopics(process.env.KAFKA_TOPICS_SUBSCRIPTION).pipe(
    //                 flatMap(() => this.setPublicationTopics(process.env.KAFKA_TOPICS_PUBLICATION).pipe(
    //                     flatMap(() => this.initializeConsumer()))
    //                 ))
    //             ))
    //         ));
    // }

    public createInitConnexionTopic(serailNumberBox: number): Observable<any> {
        const topicsToCreate = [{
            topic: `${serailNumberBox}_init_connexion`,
            partitions: 1,
            replicationFactor: 2
        }];

        const createTopic = bindCallback(this.client.createTopics.bind(this.client, topicsToCreate));
        const result = createTopic();

        return createTopic().pipe(map((result: any) => true));
    }

    public getConsumersByToptic(topicName: string): Array<ConsumerCustom> {
        return this.consumers.filter((consumer: ConsumerCustom) => {
            const exits = (consumer.consumer.consumerGroup as any).topics.find((topic: string) =>
                topic.indexOf(topicName) !== -1);
            return exits ? true : false;
        });
    }
}
