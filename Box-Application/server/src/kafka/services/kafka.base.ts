import { map, flatMap, catchError, mergeMap } from 'rxjs/operators';
import { Observable, of, bindCallback, throwError, pipe } from 'rxjs';
import { Offset, KafkaClient, ConsumerGroupOptions, HighLevelProducer, CustomPartitionAssignmentProtocol, ClusterMetadataResponse, ConsumerGroupStream, ProducerStream, KafkaClientOptions } from 'kafka-node';
import { v1 } from 'uuid';
import { DeviceExt } from "../../manager/repositories/device.ext";
import { DeviceEntity } from '../../manager/entities/device.entity';
import { Tools } from '../../common/tools-service';
import { ITopic } from '../../manager/interfaces/entities.interface';
import { CustomPartitionnerService } from './customPartitionner.service';

export class KafkaBase {
    public flagIsFirstConnection = false;
    public consumers: Array<ConsumerGroupStream> = [];
    public producer: ProducerStream;
    public offset: Offset;
    public subscribeTopics: Array<ITopic> = [];
    public publishTopics: Array<ITopic> = [];
    public reconnectInterval: any;
    public client: KafkaClient = undefined;
    public clientProducer: KafkaClient = undefined;
    public progressBar;

    public InitClients(): Observable<boolean> {
        const timeToRetryConnection = Number(process.env.KAFKA_TIME_TO_RETRY_CONNECT); // 12 seconds
        this.reconnectInterval = undefined;
        return this.initializeCLients().pipe(map((result: boolean) => {
            this.producer.on('error', (err: any) => {
                console.info("error reconnect is called in producer error event");
                this.producer.close();
                this.client.close();
                this.clientProducer.close(); // Comment out for client on close
                if (!this.reconnectInterval) { // Multiple Error Events may fire, only set one connection retry.
                    this.reconnectInterval =
                        setTimeout(() => {
                            console.info("reconnect is called in producer error event");
                            this.InitClients();
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
            this.progressBar.increment();
            return true;
        }));
    }

    public setSubscriptionTopics(cfg: any, topicsString: string): Observable<boolean> {
        topicsString.split(';').forEach((topic: string) => {
            const topicString = topic.split('.');
            if (topicString[1] && topicString[1] === 'range') {
                //const cfg = currentDevice.partitionConfigs[0];
                this.subscribeTopics.push({
                    name: topicString[0],
                    partitionTopic: {
                        current: cfg.startRange,
                        rangePartitions: [cfg.startRange, cfg.endRange]
                    }
                });
            }
        });
        this.progressBar.increment();
        return of(true);
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
        this.progressBar.increment();
        return of(true);
    }

    public setCustomPartitionAssignmentProtocol(topic: ITopic): Array<CustomPartitionAssignmentProtocol> {
        const customPartitionAssignmentProtocol: CustomPartitionAssignmentProtocol = {
            name: "customProtocol",
            version: 0,
            userData: {},
            assign: (topicPartition: any, groupMembers: any, cb: (error: any, result: any) => void) => {
                const ret: Array<any> = [];
                const lst = groupMembers.filter((grp: any) => grp.subscription[0] === topic.name);
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

    public setCfgOptions(patition: string, topic: ITopic, customProtocol = true): ConsumerGroupOptions {
        const customPartitionner: CustomPartitionnerService = new CustomPartitionnerService(topic);

        return {
            kafkaHost: process.env.KAFKA_HOSTS,
            batch: { noAckBatchSize: Number(process.env.NO_ACK_BATCH_SIZE), noAckBatchAge: Number(process.env.NO_ACK_BATCH_AGE) },
            sessionTimeout: Number(process.env.SESSION_TIMEOUT),
            groupId: process.env.GROUPID,
            protocol: customProtocol ? customPartitionner.setCustomPartitionner() : [process.env.PROTOCOL as any],
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
                for (let index = topic.partitionTopic.rangePartitions[0]; index <= topic.partitionTopic.rangePartitions[1]; index++) {
                    const consumer = new ConsumerGroupStream(this.setCfgOptions(index.toString(), topic), [topic.name]);
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
                    this.consumers.push(consumer);
                }
            }
        });
    }

    public initializeConsumer(): Observable<boolean> {
        // Tools.loginfo('    -Init consumers ...');
        const topics = this.subscribeTopics.map((topic: ITopic) => topic.name);
        const loadMetadataForTopicsObs = bindCallback(this.client.loadMetadataForTopics.bind(this.client, topics));
        const result = loadMetadataForTopicsObs();

        return result.pipe(map((results: any) => {
            if (results && results[1] && results[1][1]) {
                this.createConsumers(results[1][1]);
                this.progressBar.increment();
                Tools.stopProgress('KAFKA   ', this.progressBar);
                return true;
            }
            throwError('      => initialization failed!');
            return true;
        }));
    }

    public initializeCLients(): Observable<boolean> {
        //Tools.loginfo('    -Init producers ...');
        const config: KafkaClientOptions = {
            connectRetryOptions: { retries: Number(process.env.RETRIES), factor: Number(process.env.FACTOR), minTimeout: Number(process.env.MINTIMEOUT), maxTimeout: Number(process.env.MAXTIMEOUT), randomize: !!+process.env.RANDOMIZE },
            idleConnection: Number(process.env.IDLECONNECTION),
            kafkaHost: process.env.KAFKA_HOSTS
        };
        const cfgOption = {
            kafkaClient: config, producer: { requireAcks: 1, partitionerType: 2 }
        };

        this.client = new KafkaClient(config);
        this.clientProducer = new KafkaClient(config);
        this.producer = new ProducerStream(cfgOption);

        if ((this.producer as any).ready) {
            if (this.reconnectInterval) {
                clearTimeout(this.reconnectInterval);
                this.reconnectInterval = undefined;
            }
        }

        const loadMetadataForTopicsObs = bindCallback(this.producer.on.bind(this.clientProducer, 'ready'));
        return loadMetadataForTopicsObs().pipe(map((results: any) => {
            if (this.reconnectInterval) {
                clearTimeout(this.reconnectInterval);
                this.reconnectInterval = undefined;
            }
            this.progressBar.increment();
            return true;
        }));
    }

}
