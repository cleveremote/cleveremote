import { Message, ConsumerGroup, ConsumerGroupStream } from "kafka-node";
import { Observable, from, of, fromEvent, forkJoin } from "rxjs";
import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../../authentication/repositories/account.ext";
import { IAccount, IDevice, IPartitionConfig, IUser } from "../../manager/interfaces/entities.interface";
import { AccountEntity } from "../../authentication/entities/account.entity";
import { map, mergeMap, retryWhen, catchError, filter, tap, delay } from "rxjs/operators";
import { DeviceEntity } from "../../manager/entities/device.entity";
import { PartitionConfigEntity } from "../../manager/entities/partitionconfig.entity";
import { UserEntity } from "../../authentication/entities/user.entity";
import { UserExt } from "../../authentication/repositories/user.ext";
import { DeviceExt } from "../../manager/repositories/device.ext";
import { KafkaService } from "../../kafka/services/kafka.service";
import { MailService } from "../../common/mail-service";
import { MapperService } from "../../common/mapper.service";
import { LoggerService } from "../../common/logger.service";
import { Tools } from "../../common/tools-service";
import { WebSocketService } from "../../websocket/services/websocket.service";
import { genericRetryStrategy } from "../../common/generic-retry-strategy";
import { KafkaBase } from "../../kafka/services/kafka.base";
import { v1 } from 'uuid';

import { Injectable, Inject, forwardRef } from "@nestjs/common";

@Injectable()
export class DispatchService {
    private mapperService: MapperService;
    private loggerService: LoggerService;


    constructor(@Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService) {
        this.mapperService = new MapperService();
        this.loggerService = new LoggerService();
    }

    public init(): Observable<any> {
        const consumerObs = [];
        this.kafkaService.consumers.forEach(consumer => {
            const obs = consumer.eventData
                .pipe(filter((message: Message) => message.topic !== 'aggregator_ack'))
                .pipe(tap((message: Message) => this.consumeDataProccess(consumer.consumer, message)));

            consumerObs.push(obs);
        });
        Tools.logSuccess('  => OK.');
        forkJoin(consumerObs).subscribe();
        return of(true);
    }

    public consumeDataProccess(consumer: ConsumerGroupStream, message: Message): void {
        consumer.commit(message, true, (error, data) => {
            if (!error) {
                console.log('consumer read msg %s Topic="%s" Partition=%s Offset=%d', message.value, message.topic, message.partition, message.offset);
                this.routeMessage(message);
            } else {
                console.log(error);
            }
        });
    }

    public routeMessage(message: Message): void {
        const messageData = JSON.parse(String(message.value));
        switch (message.topic) {
            case "aggregator_init_connexion":
                this.proccessSyncConnexion(message.value).subscribe();
                break;
            case "aggregator_dbsync":
                this.mapperService.dataBaseSynchronize(String(message.value))
                    .pipe(mergeMap((boxId: string) => this.kafkaService.sendAck({ messageId: messageData.messageId, ack: true }, messageData.sourceId)
                        .pipe(tap(() => Tools.logSuccess(`     => message proccessing OK`)))))
                    .subscribe();
                break;
            case "aggregator_logsync":
                this.loggerService.logSynchronize(String(message.value));
                break;
            default:
                break;
        }
    }


    public proccessSyncConnexion(value: string | Buffer): Observable<any> {
        const data = JSON.parse(String(value));
        const deviceRepository = getCustomRepository(DeviceExt);
        const id = JSON.parse(String(value)).messageId;
        return this.kafkaService.createInitConnexionTopic(data.serialNumber)
            .pipe(delay(2000))
            .pipe( //deviceRepository.getDeviceInfosBySerial(data.serialNumber)
                mergeMap((deviceData: boolean) => {
                    const payloads = [
                        {

                            topic: `${data.serialNumber}_init_connexion`,
                            messages: JSON.stringify({ messageId: id, deviceData: 'toto' }),
                            key: `init-connexion.${data.serialNumber}`
                        }
                    ];

                    return this.kafkaService.sendMessage(payloads, true)
                        .pipe(tap((result: any) =>
                            result ? console.log('message set & received seccussefully!') : console.log('failed')
                        ));
                })
            );
    }

    public sendActivationMail(): void {
        const mailOptions = {
            from: 'cleveremote.tech@gmail.com',
            to: 'nadime.yahyaoui.ve@gmail.com',
            subject: 'Sending Email using Node.js',
            text: 'That was easy!',
            html: '<b>toto test 1234</b>'
        };
        MailService.sendMail(mailOptions);
    }

    public checkFirstConnection(): Observable<boolean> {
        const accountRepository = getCustomRepository(UserExt);

        return of(true);//accountRepository.getUserByEmail("toto");
    }

    public createAccount(message?: any): Observable<boolean> {
        const accountData: IAccount = { account_id: 'server_3', name: 'name12', description: 'description' } as any;
        const accountToSave = new AccountEntity();
        accountToSave.id = accountData.account_id;
        accountToSave.name = accountData.name;
        accountToSave.description = accountData.description;

        const userData: IUser = {
            id: 'server_3',
            email: 'email1',
            password: '$2a$08$GvDZDoL..cHoc8n8HFUp6en6PiH5I2cqYvj4xDsbomC25WPc/6Iwa1',
            number_phone: '0682737505',
            lastName: 'last_name',
            firstName: 'first_name'
        } as any;
        const userToSave = new UserEntity();
        userToSave.id = userData.id;
        userToSave.email = userData.email;
        userToSave.phone = userData.phone;
        userToSave.firstName = userData.firstName;
        userToSave.lastName = userData.lastName;
        userToSave.password = userData.password;

        accountToSave.users = [userToSave];

        return from(getRepository(AccountEntity).save(accountToSave)).pipe(
            mergeMap((accountSaved: AccountEntity) => of(true)));
    }

    public createAndLinkDevice(message?: any): Observable<boolean> {
        const userRepository = getCustomRepository(UserExt);

        return userRepository.getAccountByEmail("email1").pipe(
            mergeMap((currentAccount: AccountEntity) => {
                const deviceData: IDevice = { device_id: 'server_3', name: 'name121', description: 'description' } as any;
                const deviceToSave = new DeviceEntity();
                deviceToSave.account = currentAccount;
                deviceToSave.description = deviceData.description;
                deviceToSave.id = deviceData.device_id;
                deviceToSave.name = deviceData.name;

                const partitionData: IPartitionConfig = { config_id: 'server_3', start_range: 2, end_range: 3 } as any;
                const partitionToSave = new PartitionConfigEntity();
                partitionToSave.id = partitionData.config_id;
                partitionToSave.startRange = partitionData.start_range;
                partitionToSave.endRange = partitionData.end_range;

                deviceToSave.partitionConfigs = [partitionToSave];

                const userData: IUser = {
                    id: 'server_3',
                    email: 'email1',
                    password: '$2a$08$GvDZDoL..cHoc8n8HFUp6en6PiH5I2cqYvj4xDsbomC25WPc/6Iwa1',
                    number_phone: '0682737505',
                    lastName: 'last_name',
                    firstName: 'first_name'
                } as any;
                const userToSave = new UserEntity();
                userToSave.id = userData.id;
                userToSave.email = userData.email;
                userToSave.phone = userData.phone;
                userToSave.firstName = userData.firstName;
                userToSave.lastName = userData.lastName;
                userToSave.password = userData.password;

                currentAccount.users = [userToSave];
                currentAccount.devices = [deviceToSave];

                return from(getRepository(AccountEntity).save(currentAccount)).pipe(
                    mergeMap((accountSaved: AccountEntity) => of(true)));
            })
        );
    }

}
