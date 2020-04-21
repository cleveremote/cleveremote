import { Message, ConsumerGroupStream } from "kafka-node";
import { Observable, of, forkJoin } from "rxjs";
import { mergeMap, filter, tap, map, catchError } from "rxjs/operators";
import { KafkaService } from "../../kafka/services/kafka.service";
import { MapperService } from "../../manager/services/mapper.service";
import { LoggerService } from "../../manager/services/logger.service";
import { Tools } from "../../common/tools-service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { IPartitionConfig } from "../../kafka/interfaces/partition.config.interface";
import { v1 } from 'uuid';

import * as _colors from 'colors';
import { XbeeService } from "../../xbee/services/xbee.service";

@Injectable()
export class DispatchService {
    private mapperService: MapperService;

    constructor(
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        @Inject(forwardRef(() => XbeeService)) private readonly xbeeService: XbeeService) {
        this.mapperService = new MapperService();
    }

    public init(): Observable<any> {
        const progressBar = Tools.startProgress('Preapare Dispatch listeners    ', 0, 1, '* Start micro-service : Dispatch...');
        const consumerObs = [];
        this.kafkaService.consumers.forEach(consumer => {
            const obs = consumer.eventData
                .pipe(filter((message: Message) => message.topic !== 'box_ack' && message.topic !== `${Tools.serialNumber}_init_connexion`))
                .pipe(tap((message: Message) => this.consumeDataProccess(consumer.consumer, message)));

            consumerObs.push(obs);
        });
        forkJoin(consumerObs).subscribe();

        progressBar.increment();
        Tools.stopProgress('Preapare Dispatch listeners    ', progressBar);

        return of(true);
    }

    public consumeDataProccess(consumer: ConsumerGroupStream, message: Message): void {
        consumer.commit(message, true, (error) => {
            if (!error) {
                Tools.loginfo(`message => ${message.topic} received !`);
                Tools.logWarn(`consumer read msg ${message.value} Topic=${message.topic} Partition=${message.partition} Offset=${message.offset}`);
                this.routeMessage(message);
            } else {
                console.log(error);
            }
        });
    }


    public routeMessage(message: Message): void {
        const messageData = JSON.parse(String(message.value));
        switch (message.topic) {
            case `${Tools.serialNumber}_init_connexion`:
                this.proccessSyncConnexion();
                break;
            case "box_action":
                const data = JSON.parse(String(message.value));
                switch (data.action) {
                    case 'SCAN':
                        this.xbeeService.getNetworkGraph().pipe(mergeMap((result) =>
                            this.kafkaService.sendAck({ messageId: messageData.messageId, ack: true , graphData:result })
                                .pipe(tap(() => Tools.logSuccess(`     => message proccessing OK`)))
                        )).subscribe();
                        break;
                    case 'SWITCH':

                        break;
                    default:
                        break;
                }

                // this.kafkaService.sendAck({ messageId: messageData.messageId, ack: true })
                //     .pipe(tap(() => Tools.logSuccess(`     => message proccessing OK`))).subscribe();
                break;
            case "box_dbsync":
                // this.loggerService.logSynchronize(messageData);
                this.mapperService.dataBaseSynchronize(String(message.value))
                    .pipe(mergeMap(() => this.kafkaService.sendAck({ messageId: messageData.messageId, ack: true })
                        .pipe(tap(() => Tools.logSuccess(`     => message proccessing OK`)))))
                    .subscribe();
                break;
            default:
                break;
        }
    }

    public proccessSyncConnexion(): Observable<IPartitionConfig> {
        // const data = JSON.parse(String(value));
        // const accountData: IAccount = data.account;
        // const accountToSave = new AccountEntity();
        // accountToSave.accountId = accountData.accountId;
        // accountToSave.name = accountData.name;
        // accountToSave.description = accountData.description;

        // const deviceData: IDevice = data.device;
        // const deviceToSave = new DeviceEntity();
        // deviceToSave.account = accountToSave;
        // deviceToSave.description = deviceData.description;
        // deviceToSave.deviceId = deviceData.deviceId;
        // deviceToSave.name = deviceData.name;

        // const partitionData: IPartitionConfig = data.partitionConfig;
        // const partitionToSave = new PartitionConfigEntity();
        // partitionToSave.configId = partitionData.configId;
        // partitionToSave.startRange = partitionData.startRange;
        // partitionToSave.endRange = partitionData.endRange;

        // deviceToSave.partitionConfigs = [partitionToSave];

        // const userData: IUser = data.user;
        // const userToSave = new UserEntity();
        // userToSave.userId = userData.userId;
        // userToSave.email = userData.email;
        // userToSave.phone = userData.phone;
        // userToSave.firstName = userData.firstName;
        // userToSave.lastName = userData.lastName;
        // userToSave.password = userData.password;

        // accountToSave.users = [userToSave];
        // accountToSave.devices = [deviceToSave];

        // return from(getRepository(AccountEntity).save(accountToSave)).pipe(
        //     mergeMap((accountSaved: AccountEntity) => of(true)));
        // todo throw if no config partition
        const partitionCfg: IPartitionConfig = { endRange: 1, startRange: 0 };
        return of(partitionCfg);
    }

    public initFirstConnexion(): Observable<IPartitionConfig | boolean> {
        const progressBar = Tools.startProgress('Notify server first connexion  ', 0, 3);
        const initData = { serialNumber: Tools.serialNumber, messageId: v1() };
        const payloads = [{ topic: 'aggregator_init_connexion', messages: JSON.stringify(initData), key: 'init-connexion' }];

        return this.kafkaService.sendMessage(payloads, true, 'init_connexion')
            .pipe(mergeMap((response: [Message, boolean]) => {
                const message = JSON.parse(String(response[0].value));
                progressBar.increment();
                return this.proccessSyncConnexion()
                    .pipe(mergeMap((partitionCfg: IPartitionConfig) => {
                        progressBar.increment();
                        return this.kafkaService.sendAck({
                            messageId: message.messageId, ack: true
                        }).pipe(map(() => {
                            progressBar.increment();
                            return partitionCfg;
                        }));
                    }
                    ));
            }))
            .pipe(tap(() => Tools.stopProgress('Kafka deep configuration       ', progressBar)))
            .pipe(tap(() => Tools.logSuccess(`     => message proccessing OK`)))
            .pipe(
                catchError(error => {
                    Tools.stopProgress('Kafka deep configuration       ', progressBar, error);
                    return of(false);
                })
            );
    }

}
