import { EntityRepository, Repository, getCustomRepository } from "typeorm";
import { User } from "../entities/users";
import { Observable, from, of } from "rxjs";
import { Account } from "../entities/account";
import { map, mergeMap } from "rxjs/operators";
import { IAccount, IDevice, IPartitionConfig, IUser, ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { Device } from "../entities/device";
import { UserExt } from "./user.ext";
import { PartitionConfig } from "../entities/partition_config";

@EntityRepository(Account)
export class AccountExt extends Repository<Account> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
    }

    public isBoxInitialized(): Observable<boolean> {
        return from(this.find({ relations: ['devices', 'users', 'devices.partition_configs'] })).pipe(
            map((acc: Array<Account>) => {

                if (!acc) {
                    console.log('no account found');

                    return false;
                }

                if (acc[0].devices.length === 0) {
                    console.log('No devices');

                    return false;
                }

                return true;
            }));
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

        return from(this.save(accountToSave)).pipe(
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

                return from(this.save(currentAccount)).pipe(
                    mergeMap((accountSaved: Account) => of(true)));
            })
        );
    }

}
