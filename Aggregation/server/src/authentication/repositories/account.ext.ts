import { EntityRepository, Repository, getCustomRepository, DeleteResult, FindManyOptions } from "typeorm";
import { UserEntity } from "../entities/user.entity";
import { Observable, from, of } from "rxjs";
import { AccountEntity } from "../entities/account.entity";
import { map, mergeMap } from "rxjs/operators";
import { IAccount, IDevice, IPartitionConfig, IUser, ISynchronize, ISynchronizeParams } from "../../manager/interfaces/entities.interface";
import { DeviceEntity } from "../../manager/entities/device.entity";
import { UserExt } from "./user.ext";
import { PartitionConfigEntity } from "../../manager/entities/partitionconfig.entity";
import { AccountDto } from "../dto/account.dto";
import { AccountQueryDto } from "../dto/account.query.dto";
import { plainToClass, classToClass } from "class-transformer";

@EntityRepository(AccountEntity)
export class AccountExt extends Repository<AccountEntity> implements ISynchronize<AccountEntity | boolean> {

    public synchronize(params: ISynchronizeParams): Observable<AccountEntity | boolean> {
        //this.updateAccount(data.data).subscribe();
        return of(new AccountEntity());
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

    public getDeviceId(id: string): Observable<string> {
        return of('server_1');
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
            phone: '0682737505',
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
                    last_name: 'last_name',
                    first_name: 'first_name'
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

                return from(this.save(currentAccount)).pipe(
                    mergeMap((accountSaved: AccountEntity) => of(true)));
            })
        );
    }


    public updateAccount(data: AccountDto): Observable<AccountEntity> {
        return from(this.save(data)).pipe(
            map((acc: AccountEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public addAccount(data: AccountDto): Observable<AccountEntity> {
        return from(this.save(data)).pipe(
            map((acc: AccountEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public deleteAccount(id: string): Observable<boolean> {
        return from(this.delete({ id: id })).pipe(
            map((deleteResult: DeleteResult) => {

                if (!deleteResult) {
                    console.log('Failed to delete');

                    return undefined;
                }

                return true;
            }));
    }

    public getAll(moduleQueryDto: AccountQueryDto): Observable<Array<AccountEntity>> {

        const options: FindManyOptions<AccountEntity> = { where: plainToClass(AccountEntity, moduleQueryDto) };
        const filter = {};

        for (let [key, value] of Object.entries(moduleQueryDto)) {
            filter[key] = value;
        }

        return from(this.find({ where: filter, relations: ['users', 'devices'] })).pipe(
            map((accounts: Array<AccountEntity>) => {

                if (!accounts) {
                    console.log('no account found');

                    return [];
                }

                if (accounts.length === 0) {
                    console.log('No accounts');

                    return [];
                }

                return accounts;
            }));
    }

    public getAccount(id?: string): Observable<AccountEntity> {
        return from(this.findOne({ where: { id: id }, relations: ['users', 'devices', 'devices.partitionConfigs', 'users.providers'] })).pipe(
            map((account: AccountEntity) => {

                if (!account) {
                    console.log('no module found');

                    return undefined;
                }

                return account;
            }));
    }

    public getAccountToSync(serialNumber: string): Observable<AccountEntity> {

        return from(this.findOne({
            join: { alias: 'account', innerJoin: { devices: 'account.devices' } },
            where: qb => {
                qb.where('devices.id = :serialNumber', { serialNumber: serialNumber })
            },
            relations: ['users', 'devices', 'devices.partitionConfigs']
        })).pipe(
            map((account: AccountEntity) => {

                if (!account) {
                    console.log('account Not found!');

                    return undefined;
                }

                if (account.devices && account.devices.length > 0) {
                    account.devices = account.devices.filter((device: DeviceEntity) => device.id === serialNumber);
                }

                return account;
            }));
    }

    public getFrontAccountData(accountId: string):Observable<AccountEntity> {
        return from(this.findOne({
            where: { id: accountId },
            relations: [
                'users',
                'devices',
                'devices.groupViews',
                'devices.groupViews.modules',
                'devices.groupViews.modules.transceiver',
                'devices.transceivers',
                'devices.transceivers.modules',
                'devices.transceivers.modules.transceiver',
                'devices.schemes',
                'devices.schemes.sectors',
                'devices.schemes.sectors.schemeDetail',
                'devices.schemes.sectors.schemeDetail.sectors',
                'devices.schemes.sectors.schemeDetail.sectors.groupView',
                'devices.schemes.sectors.schemeDetail.sectors.groupView.modules',
                'devices.schemes.sectors.schemeDetail.sectors.groupView.modules.transceiver',
                'devices.schemes.sectors.groupView',
                'devices.schemes.sectors.groupView.modules',
                'devices.schemes.sectors.groupView.modules.transceiver'

            ]
        })).pipe(
            map((account: AccountEntity) => {

                if (!account) {
                    console.log('no module found');

                    return undefined;
                }

                return account;
            }));
    }


}
