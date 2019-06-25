import { Message, ConsumerGroup } from "kafka-node";
import { Observable, from, of } from "rxjs";
import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../entities/custom.repositories/account.ext";
import { IAccount, IDevice, IPartitionConfig, IUser } from "../entities/interfaces/entities.interface";
import { Account } from "../entities/gen.entities/account";
import { map, mergeMap } from "rxjs/operators";
import { Device } from "../entities/gen.entities/device";
import { PartitionConfig } from "../entities/gen.entities/partition_config";
import { User } from "../entities/gen.entities/users";
import { UserExt } from "../entities/custom.repositories/user.ext";
import { DeviceExt } from "../entities/custom.repositories/device.ext";
import { KafkaService } from "./kafka.service";
import { MailService } from "./mail-service";
import { MapperService } from "./mapper.service";
import { LoggerService } from "./logger.service";
import { Tools } from "./tools-service";

export class DispatchService {
    private mapperService: MapperService;
    private loggerService: LoggerService;

    constructor() {
        this.mapperService = new MapperService();
        this.loggerService = new LoggerService();
    }

    public init(): Observable<void> {
        KafkaService.instance.consumers.forEach(consumer => {
            consumer.on('message', (message: Message) => {
                this.routeMessage(consumer, message);
            });
            consumer.on('error', (err: any) => {
                Tools.logError('error', err);
            });
        });
        Tools.logSuccess('  => OK.');

        return of(undefined);

    }

    public routeMessage(consumer: ConsumerGroup, message: Message): void {
        console.log(
            '%s read msg %s Topic="%s" Partition=%s Offset=%d',
            consumer.memberId, message.value, message.topic, message.partition, message.offset
        );

        switch (message.topic) {
            case "aggregator_init_connexion":
                this.proccessSyncConnexion(message.value);
                break;
            case "aggregator_dbsync":
                // this.mapperService.dataBaseSynchronize(String(message.value));
                const t = 2;
                break;
            case "aggregator_logsync":
                this.loggerService.logSynchronize(String(message.value));
                break;
            default:
                break;
        }
    }

    public proccessSyncConnexion(value: string | Buffer): Observable<void> {
        const data = JSON.parse(String(value));
        const deviceRepository = getCustomRepository(DeviceExt);

        return deviceRepository.getDeviceInfosBySerial(data.serialNumber).pipe(
            map((deviceData: Device) => {
                const t = deviceData;
                const payloads = [
                    {
                        topic: `${data.serialNumber}-init-connexion`,
                        messages: JSON.stringify(deviceData),
                        key: `init-connexion.${data.serialNumber}`
                    }
                ];

                KafkaService.instance.producer.send(payloads, (err: any, result: any) => {
                    console.log(data);
                    this.sendActivationMail();
                });
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
