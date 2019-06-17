import { Message, ConsumerGroup } from "kafka-node";
import { Observable, from, of } from "rxjs";
import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../entities/custom.repositories/account.ext";
import { IAccount, IDevice, IPartitionConfig, IUser } from "../entities/interfaces/entities.interface";
import { account } from "../entities/gen.entities/account";
import { map, mergeMap } from "rxjs/operators";
import { device } from "../entities/gen.entities/device";
import { partition_config } from "../entities/gen.entities/partition_config";
import { users } from "../entities/gen.entities/users";
import { UserExt } from "../entities/custom.repositories/user.ext";

export class DispatchService {
    constructor(private readonly topics: Array<any>) {
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
    }

    public checkFirstConnection(): Observable<boolean> {
        const accountRepository = getCustomRepository(AccountExt);

        return accountRepository.isBoxInitialized();

    }

    public initFirstConnexion(message: Message): Observable<boolean> {
        // get the message Value json parse 
        // response init data 
        // "account(account_id, name, description)"
        // "partition_config(config_id, start_range, end_range)"
        // "device(device_id, name, description,account_id,config_id)"
        // "users(user_id, first_name, last_name, email, number_phone, password, account_id)"
        const accountData: IAccount = {} as any;
        const accountToSave = new account();
        accountToSave.account_id = accountData.account_id;
        accountToSave.name = accountData.name;
        accountToSave.description = accountData.description;

        return from(getRepository(account).save(accountToSave)).pipe(
            mergeMap((accountSaved: account) => {
                const partitionData: IPartitionConfig = {} as any;
                const partitionToSave = new partition_config();
                partitionToSave.config_id = partitionData.config_id;
                partitionToSave.start_range = partitionData.start_range;
                partitionToSave.end_range = partitionData.end_range;

                return from(getRepository(partition_config).save(partitionToSave)).pipe(
                    mergeMap((partitionSaved: partition_config) => {
                        const deviceData: IDevice = {} as any;
                        const deviceToSave = new device();
                        deviceToSave.account = accountSaved;
                        deviceToSave.description = deviceData.description;
                        deviceToSave.device_id = deviceData.device_id;
                        deviceToSave.name = deviceData.name;

                        return from(getRepository(device).save(deviceToSave)).pipe(
                            mergeMap((deviceSaved: device) => {
                                const userData: IUser = {} as any;
                                const userToSave = new users();
                                userToSave.account = accountSaved;
                                userToSave.email = userData.email;
                                userToSave.first_name = userData.first_name;
                                userToSave.last_name = userData.last_name;
                                userToSave.number_phone = userData.number_phone;
                                userToSave.password = userData.password;
                                userToSave.user_id = userData.user_id;

                                return from(getRepository(users).save(userToSave)).pipe(
                                    map((userSaved: users) => {
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
            mergeMap((currentAccount: account) => {
                const deviceData: IDevice = { device_id: 'server_3', name: 'name121', description: 'description' } as any;
                const deviceToSave = new device();
                deviceToSave.account = currentAccount;
                deviceToSave.description = deviceData.description;
                deviceToSave.device_id = deviceData.device_id;
                deviceToSave.name = deviceData.name;

                const partitionData: IPartitionConfig = { config_id: 'server_3', start_range: 2, end_range: 3 } as any;
                const partitionToSave = new partition_config();
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
                const userToSave = new users();
                userToSave.user_id = userData.user_id;
                userToSave.email = userData.email;
                userToSave.number_phone = userData.number_phone;
                userToSave.first_name = userData.first_name;
                userToSave.last_name = userData.last_name;
                userToSave.password = userData.password;

                currentAccount.users = [userToSave];
                currentAccount.devices = [deviceToSave];

                return from(getRepository(account).save(currentAccount)).pipe(
                    mergeMap((accountSaved: account) => of(true)));
            })
        )


    }

    public initFirstConnexionCascade(message?: Message): Observable<boolean> {

        const accountData: IAccount = { account_id: 'server_3', name: 'name12', description: 'description' } as any;
        const accountToSave = new account();
        accountToSave.account_id = accountData.account_id;
        accountToSave.name = accountData.name;
        accountToSave.description = accountData.description;

        const deviceData: IDevice = { device_id: 'server_3', name: 'name121', description: 'description' } as any;
        const deviceToSave = new device();
        deviceToSave.account = accountToSave;
        deviceToSave.description = deviceData.description;
        deviceToSave.device_id = deviceData.device_id;
        deviceToSave.name = deviceData.name;

        const partitionData: IPartitionConfig = { config_id: 'server_3', start_range: 2, end_range: 3 } as any;
        const partitionToSave = new partition_config();
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
        const userToSave = new users();
        userToSave.user_id = userData.user_id;
        userToSave.email = userData.email;
        userToSave.number_phone = userData.number_phone;
        userToSave.first_name = userData.first_name;
        userToSave.last_name = userData.last_name;
        userToSave.password = userData.password;

        accountToSave.users = [userToSave];
        accountToSave.devices = [deviceToSave];

        return from(getRepository(account).save(accountToSave)).pipe(
            mergeMap((accountSaved: account) => of(true)));
    }

}
