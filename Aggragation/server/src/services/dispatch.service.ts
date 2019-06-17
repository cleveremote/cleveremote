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

export class DispatchService {
    constructor(private kafkaService: KafkaService) {
    }

    public routeMessage(consumer: ConsumerGroup, message: Message): void {
        console.log(
            '%s read msg %s Topic="%s" Partition=%s Offset=%d',
            consumer.memberId,
            message.value,
            message.topic,
            message.partition,
            message.offset
        );

        switch (message.topic) {
            case "aggregator_init_connexion":
                this.proccessSyncConnexion(message.value);
                break;
            case "aggregator_dbsync":
                //message.value
                // params: entity , data , action:create update delete
                break;
            case "aggregator_logsync":
                // params: source = boxId, data
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

                this.kafkaService.producer.send(payloads, (err: any, result: any) => {
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

    public initFirstConnexion(message: Message): Observable<boolean> {
        const accountData: IAccount = {} as any;
        const accountToSave = new Account();
        accountToSave.account_id = accountData.account_id;
        accountToSave.name = accountData.name;
        accountToSave.description = accountData.description;

        return from(getRepository(Account).save(accountToSave)).pipe(
            mergeMap((accountSaved: Account) => {
                const partitionData: IPartitionConfig = {} as any;
                const partitionToSave = new PartitionConfig();
                partitionToSave.config_id = partitionData.config_id;
                partitionToSave.start_range = partitionData.start_range;
                partitionToSave.end_range = partitionData.end_range;

                return from(getRepository(PartitionConfig).save(partitionToSave)).pipe(
                    mergeMap((partitionSaved: PartitionConfig) => {
                        const deviceData: IDevice = {} as any;
                        const deviceToSave = new Device();
                        deviceToSave.account = accountSaved;
                        deviceToSave.description = deviceData.description;
                        deviceToSave.device_id = deviceData.device_id;
                        deviceToSave.name = deviceData.name;

                        return from(getRepository(Device).save(deviceToSave)).pipe(
                            mergeMap((deviceSaved: Device) => {
                                const userData: IUser = {} as any;
                                const userToSave = new User();
                                userToSave.account = accountSaved;
                                userToSave.email = userData.email;
                                userToSave.first_name = userData.first_name;
                                userToSave.last_name = userData.last_name;
                                userToSave.number_phone = userData.number_phone;
                                userToSave.password = userData.password;
                                userToSave.user_id = userData.user_id;

                                return from(getRepository(User).save(userToSave)).pipe(
                                    map((userSaved: User) => {
                                        const t = 2;

                                        return true;
                                    }));
                            }));
                    }));
            }));
    }
    public createAccount(message?: any): Observable<boolean> {
        // const accountData: IAccount = { account_id: 'server_3', name: 'name12', description: 'description' } as any;
        // const accountToSave = new account();
        // accountToSave.account_id = accountData.account_id;
        // accountToSave.name = accountData.name;
        // accountToSave.description = accountData.description;

        // const userData: IUser = {
        //     user_id: 'server_3',
        //     email: 'email1',
        //     password: '$2a$08$GvDZDoL..cHoc8n8HFUp6en6PiH5I2cqYvj4xDsbomC25WPc/6Iwa1',
        //     number_phone: '0682737505',
        //     last_name: 'last_name',
        //     first_name: 'first_name'
        // } as any;
        // const userToSave = new users();
        // userToSave.user_id = userData.user_id;
        // userToSave.email = userData.email;
        // userToSave.number_phone = userData.number_phone;
        // userToSave.first_name = userData.first_name;
        // userToSave.last_name = userData.last_name;
        // userToSave.password = userData.password;

        // accountToSave.users = [userToSave];

        // return from(getRepository(account).save(accountToSave)).pipe(
        //     mergeMap((accountSaved: account) => of(true)));
        return of(true);
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
        )


    }

    public initFirstConnexionCascade(message?: Message): Observable<boolean> {

        const accountData: IAccount = { account_id: 'server_3', name: 'name12', description: 'description' } as any;
        const accountToSave = new Account();
        accountToSave.account_id = accountData.account_id;
        accountToSave.name = accountData.name;
        accountToSave.description = accountData.description;

        const deviceData: IDevice = { device_id: 'server_3', name: 'name121', description: 'description' } as any;
        const deviceToSave = new Device();
        deviceToSave.account = accountToSave;
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

        accountToSave.users = [userToSave];
        accountToSave.devices = [deviceToSave];

        return from(getRepository(Account).save(accountToSave)).pipe(
            mergeMap((accountSaved: Account) => of(true)));
    }

}
