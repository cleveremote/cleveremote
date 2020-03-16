import { Message, ConsumerGroup, ConsumerGroupStream } from "kafka-node";
import { Observable, from, of, fromEvent, forkJoin } from "rxjs";
import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../../manager/repositories/account.ext";
import { IAccount, IDevice, IPartitionConfig, IUser } from "../../manager/interfaces/entities.interface";
import { Account } from "../../manager/entities/account";
import { map, mergeMap, retryWhen, catchError, filter, tap, delay } from "rxjs/operators";
import { Device } from "../../manager/entities/device";
import { PartitionConfig } from "../../manager/entities/partition_config";
import { User } from "../../manager/entities/users";
import { UserExt } from "../../manager/repositories/user.ext";
import { DeviceExt } from "../../manager/repositories/device.ext";
import { KafkaService } from "../../kafka/services/kafka.service";
import { MailService } from "../../manager/services/mail-service";
import { MapperService } from "../../manager/services/mapper.service";
import { LoggerService } from "../../manager/services/logger.service";
import { Tools } from "../../common/tools-service";
import { WebSocketService } from "../../manager/services/websocket.service";
import { genericRetryStrategy } from "../../common/generic-retry-strategy";
import { KafkaInit } from "../../kafka/services/kafka.init";
import { v1 } from 'uuid';

export class DispatchService {
    private mapperService: MapperService;
    private loggerService: LoggerService;


    constructor() {
        this.mapperService = new MapperService();
        this.loggerService = new LoggerService();
    }

    public init(): Observable<any> {
        const consumerObs = [];
        KafkaService.instance.consumers.forEach(consumer => {
            const obs = consumer.eventData
                .pipe(filter((message: Message) => message.topic !== 'box_action_response'))
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
        switch (message.topic) {
            case "aggregator_init_connexion":
                this.proccessSyncConnexion(message.value).subscribe();
                break;
            case "aggregator_dbsync":
                // this.mapperService.dataBaseSynchronize(String(message.value));
                // KafkaService.instance.arrayOfResponse.push(message);
                // WebSocketService.sendMessage('server_1', String(message.value));
                break;
            case "box_action_response":
                // this.mapperService.dataBaseSynchronize(String(message.value));
                KafkaService.instance.arrayOfResponse.push(message);
                // WebSocketService.sendMessage('server_1', String(message.value));
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
        return KafkaService.instance.createInitConnexionTopic(data.serialNumber)
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

                    return KafkaService.instance.sendMessage(payloads, true, true)
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

        return accountRepository.getUserByEmail("toto");
    }

    public createAccount(message?: any): Observable<boolean> {
        const accountData: IAccount = { account_id: 'server_3', name: 'name12', description: 'description' } as any;
        const accountToSave = new Account();
        accountToSave.account_id = accountData.account_id;
        accountToSave.name = accountData.name;
        accountToSave.description = accountData.description;

        const userData: IUser = {
            user_id: 'server_3',
            email: 'email1',
            password: '$2a$08$GvDZDoL..cHoc8n8HFUp6en6PiH5I2cqYvj4xDsbomC25WPc/6Iwa1',
            number_phone: '0682737505',
            last_name: 'last_name',
            first_name: 'first_name'
        } as any;
        const userToSave = new User();
        userToSave.user_id = userData.user_id;
        userToSave.email = userData.email;
        userToSave.number_phone = userData.number_phone;
        userToSave.first_name = userData.first_name;
        userToSave.last_name = userData.last_name;
        userToSave.password = userData.password;

        accountToSave.users = [userToSave];

        return from(getRepository(Account).save(accountToSave)).pipe(
            mergeMap((accountSaved: Account) => of(true)));
    }

    public createAndLinkDevice(message?: any): Observable<boolean> {
        const userRepository = getCustomRepository(UserExt);

        return userRepository.getAccountByEmail("email1").pipe(
            mergeMap((currentAccount: Account) => {
                const deviceData: IDevice = { device_id: 'server_3', name: 'name121', description: 'description' } as any;
                const deviceToSave = new Device();
                deviceToSave.account = currentAccount;
                deviceToSave.description = deviceData.description;
                deviceToSave.device_id = deviceData.device_id;
                deviceToSave.name = deviceData.name;

                const partitionData: IPartitionConfig = { config_id: 'server_3', start_range: 2, end_range: 3 } as any;
                const partitionToSave = new PartitionConfig();
                partitionToSave.config_id = partitionData.config_id;
                partitionToSave.start_range = partitionData.start_range;
                partitionToSave.end_range = partitionData.end_range;

                deviceToSave.partition_configs = [partitionToSave];

                const userData: IUser = {
                    user_id: 'server_3',
                    email: 'email1',
                    password: '$2a$08$GvDZDoL..cHoc8n8HFUp6en6PiH5I2cqYvj4xDsbomC25WPc/6Iwa1',
                    number_phone: '0682737505',
                    last_name: 'last_name',
                    first_name: 'first_name'
                } as any;
                const userToSave = new User();
                userToSave.user_id = userData.user_id;
                userToSave.email = userData.email;
                userToSave.number_phone = userData.number_phone;
                userToSave.first_name = userData.first_name;
                userToSave.last_name = userData.last_name;
                userToSave.password = userData.password;

                currentAccount.users = [userToSave];
                currentAccount.devices = [deviceToSave];

                return from(getRepository(Account).save(currentAccount)).pipe(
                    mergeMap((accountSaved: Account) => of(true)));
            })
        );
    }

}
