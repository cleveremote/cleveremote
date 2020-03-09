import { EntityRepository, Repository, getCustomRepository } from "typeorm";
import { UserEntity } from "../gen.entities/user.entity";
import { Observable, from, of } from "rxjs";
import { AccountEntity } from "../gen.entities/account.entity";
import { map, mergeMap } from "rxjs/operators";
import { IAccount, IDevice, IPartitionConfig, IUser, ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { DeviceEntity } from "../../kafka/entities/device.entity";
import { UserExt } from "./user.ext";
import { PartitionConfig } from "../../kafka/entities/partitionconfig.entity";
import { FORMERR } from "dns";

@EntityRepository(AccountEntity)
export class AccountExt extends Repository<AccountEntity> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        this.updateAccount(data.data).subscribe();
    }

    public updateAccount(data: any): Observable<AccountEntity> {
        return from(this.save(data)).pipe(
            map((acc: AccountEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public isBoxInitialized(): Observable<boolean> {
        return from(this.find({ relations: ['devices', 'users', 'devices.partition_configs'] })).pipe(
            map((acc: Array<AccountEntity>) => {

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
        const accountToSave = new AccountEntity();
        accountToSave.accountId = accountData.accountId;
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
        const userToSave = new UserEntity();
        userToSave.userId = userData.userId;
        userToSave.email = userData.email;
        userToSave.phone = userData.phone;
        userToSave.firstName = userData.firstName;
        userToSave.lastName = userData.lastName;
        userToSave.password = userData.password;

        accountToSave.users = [userToSave];

        return from(this.save(accountToSave)).pipe(
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
                deviceToSave.deviceId = deviceData.deviceId;
                deviceToSave.name = deviceData.name;

                const partitionData: IPartitionConfig = { config_id: 'server_3', start_range: 2, end_range: 3 } as any;
                const partitionToSave = new PartitionConfig();
                partitionToSave.configId = partitionData.configId;
                partitionToSave.startRange = partitionData.startRange;
                partitionToSave.endRange = partitionData.endRange;

                deviceToSave.partitionConfigs = [partitionToSave];

                const userData: IUser = {
                    userId: 'server_3',
                    email: 'email1',
                    password: '$2a$08$GvDZDoL..cHoc8n8HFUp6en6PiH5I2cqYvj4xDsbomC25WPc/6Iwa1',
                    phone: '0682737505',
                    lastName: 'last_name',
                    firstName: 'first_name'
                } as any;
                const userToSave = new UserEntity();
                userToSave.userId = userData.userId;
                userToSave.email = userData.email;
                userToSave.phone = userData.phone;
                userToSave.firstName = userData.firstName;
                userToSave.lastName = userData.lastName;
                userToSave.password = userData.password;

                currentAccount.users = [userToSave];
                currentAccount.devices = [deviceToSave];

                return from(this.save(currentAccount)).pipe(
                    mergeMap((accountSaved: AccountEntity) => of(true)));
            })
        );
    }

}
