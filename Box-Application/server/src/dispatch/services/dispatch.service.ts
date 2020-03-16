import { Message, ConsumerGroup, ConsumerGroupStream } from "kafka-node";
import { Observable, from, of, fromEvent, forkJoin } from "rxjs";
import { IAccount, IDevice, IUser } from "../../manager/interfaces/entities.interface";
import { AccountEntity } from "../../manager/entities/account.entity";
import { mergeMap, filter, tap, map, catchError } from "rxjs/operators";
import { PartitionConfigEntity } from "../../manager/entities/partitionconfig.entity";
import { UserEntity } from "../../manager/entities/user.entity";
import { KafkaService } from "../../kafka/services/kafka.service";
import { MapperService } from "../../manager/services/mapper.service";
import { LoggerService } from "../../manager/services/logger.service";
import { Tools } from "../../common/tools-service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { getRepository } from "typeorm";
import { multibar } from "../../common/progress.bar";
import { DeviceEntity } from "../../manager/entities/device.entity";
import { IPartitionConfig } from "../../kafka/interfaces/partition.config.interface";
import { v1 } from 'uuid';

import * as cliProgress from 'cli-progress';
import * as _colors from 'colors';
import uuid = require("uuid");

@Injectable()
export class DispatchService {
    private mapperService: MapperService;
    private loggerService: LoggerService;

    constructor(@Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService) {
        this.mapperService = new MapperService();
        this.loggerService = new LoggerService();
    }

    public init(): Observable<any> {
        const progressBar = Tools.startProgress('Preapare Dispatch listeners    ', 0, 1, '* Start micro-service : Dispatch...');
        const consumerObs = [];
        this.kafkaService.consumers.forEach(consumer => {
            const obs = consumer.eventData
                .pipe(filter((message: Message) => message.topic !== 'box_action_response' && message.topic !== `${Tools.serialNumber}_init_connexion`))
                .pipe(tap((message: Message) => this.consumeDataProccess(consumer.consumer, message)));

            consumerObs.push(obs);
        });
        forkJoin(consumerObs).subscribe();

        progressBar.increment();
        Tools.stopProgress('Preapare Dispatch listeners    ', progressBar);

        return of(true);
    }

    public consumeDataProccess(consumer: ConsumerGroupStream, message: Message): void {
        consumer.commit(message, true, (error, data) => {
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
        const messageData = JSON.parse(String(message.value))
        switch (message.topic) {
            case `${Tools.serialNumber}_init_connexion`:
                this.proccessSyncConnexion(String(message.value));
                break;
            case "box_action":
                this.kafkaService.sendAck({ messageId: messageData.messageId, ack: true })
                    .pipe(tap(() => Tools.logSuccess(`     => message proccessing OK`))).subscribe();
                break;
            case "box_dbsync":
                // this.loggerService.logSynchronize(messageData);
                this.mapperService.dataBaseSynchronize(String(message.value))
                    .pipe(mergeMap((result) => this.kafkaService.sendAck({ messageId: messageData.messageId, ack: true })
                        .pipe(tap(() => Tools.logSuccess(`     => message proccessing OK`)))))
                    .subscribe();
                break;
            default:
                break;
        }
    }

    public proccessSyncConnexion(data: any): Observable<IPartitionConfig> {
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
                return this.proccessSyncConnexion(message)
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
            .pipe(tap((config: IPartitionConfig) => Tools.logSuccess(`     => message proccessing OK`)))
            .pipe(
                catchError(error => {
                    Tools.stopProgress('Kafka deep configuration       ', progressBar, error);
                    return of(false);
                })
            );
    }

}
