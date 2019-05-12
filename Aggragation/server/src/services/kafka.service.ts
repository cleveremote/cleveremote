import * as WebSocket from 'ws';
import * as http from "http";
import { map, tap } from 'rxjs/operators';
import { of as observableOf, from as observableFrom, Observable, of, observable } from 'rxjs';
import { Consumer, Offset, KafkaClient, Producer, KeyedMessage, ConsumerGroup, ConsumerGroupOptions } from 'kafka-node';

export class KafkaService {
    public consumer: ConsumerGroup;
    public producer: Producer;
    public offset: Offset;
    private readonly topicTest = 'topic-mitosis';
    private readonly client: KafkaClient = undefined;
    constructor() {
        this.client = new KafkaClient({ kafkaHost: '192.168.1.30:32771,192.168.1.30:32770' });

        const ackBatchOptions = { noAckBatchSize: 1024, noAckBatchAge: 10 };
        const cgOptions: ConsumerGroupOptions = {
            kafkaHost: '192.168.1.30:32771,192.168.1.30:32770',
            batch: ackBatchOptions,
            groupId: 'groupID',
            id: 'consumerID',
            sessionTimeout: 15000,
            protocol: ["roundrobin"],
            fromOffset: "latest",
            migrateHLC: false,
            migrateRolling: true
        };

        this.consumer = new ConsumerGroup(cgOptions, [this.topicTest]);

        const topics = [this.topicTest];
        const options = { autoCommit: false }; // , fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024
        this.producer = new Producer(this.client, { requireAcks: 1 });
        this.offset = new Offset(this.client);
        // this.offset.fetch([
        //     { topic: this.topicTest, partition: 0, time: -1, maxNum: 1 }
        // ], function (err, data) {
        //     data
        //     { 't': { '0': [999] } }
        // });
    }

    public initializeProducer(): void {
        const km = new KeyedMessage('key', 'message');
        const payloads = [
            { topic: 'topic-mitosis', messages: 'hi', partition: 0 },
            { topic: 'topic-mitosis', messages: ['hello', 'world1', km] }
        ];
        this.producer.on('ready', () => {
            this.producer.send(payloads, (err, data) => {
                console.log(data);
            });
        });
        this.producer.on('error', (err: any) => {
            console.log('error', err);
        });
    }

    public initializeConsumer(): void {
        this.consumer.on('offsetOutOfRange', (topic: any) => {
            topic.maxNum = 1;
            this.offset.fetch([topic], (err, offsets) => {
                if (err) {
                    console.log('error', err);
                }
                const min = Math.min(offsets[topic.topic][topic.partition]);
                this.consumer.setOffset(topic.topic, topic.partition, min);
            });
        });
        this.consumer.on('message', (result: any) => {
            // const receivedMessage = JSON.parse(result.value);
            console.log(`message received kafka: ${result.value}`);
            // let cell = await Cell.save(newCell as ICell);
            // save in db mongo ...
            // pubsub.publish('newCell', { newCell: cell });
            // notify with websocket if need
        });
        this.consumer.on('error', (err: any) => {
            console.log('error', err);
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
