import { EntityRepository, Repository, DeleteResult, FindManyOptions } from "typeorm";
import { UserEntity } from "../entities/user.entity";
import * as bcrypt from 'bcrypt-nodejs';
import { Observable, from, of } from "rxjs";
import { map } from "rxjs/operators";
import { AccountEntity } from "../entities/account.entity";
import { ISynchronize, ISynchronizeParams } from "../../manager/interfaces/entities.interface";

import { UserDto } from "../dto/user.dto";
import { UserQueryDto } from "../dto/user.query.dto";
import { plainToClass, classToClass } from "class-transformer";

@EntityRepository(UserEntity)
export class UserExt extends Repository<UserEntity> implements ISynchronize<UserEntity | boolean> {

    public synchronize(params: ISynchronizeParams): Observable<UserEntity | boolean> {
        //this.updateAccount(data.data).subscribe();
        return of(new UserEntity());
    }

    public getDeviceId(id: string): Observable<string> {
        return of('server_1');
    }

    public generateHash(password: any): string {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
    }

    public validPassword(password: string, entityPassword: string): boolean {
        return bcrypt.compareSync(password, entityPassword);
    }

    public authenticate(req: any, mail: any, password: any, done: any): void {
        this.findOne({ where: { email: mail }, relations: ['account'] }).then((user: UserEntity) => {

            if (!user) {
                console.log('no user found');

                return done(undefined, false);
            }

            if (!this.validPassword(password, user.password)) {
                console.log('wrong password');

                return done(undefined, false);
            }

            return done(undefined, user);
        });
    }


    public getUserByEmail(email?: string): Observable<UserEntity> { // relations: ['account', 'account.devices', 'account.devices.config']
        return from(this.findOne({ where: { email: "nadime.yahyaoui@gmail.com" }, relations: ['account', 'account.devices'] })).pipe(
            map((acc: UserEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                // if (acc[0].devices.length === 0) {
                //     console.log('No devices');

                //     return undefined;
                // }

                return acc;
            }));
    }

    public getAccountByEmail(email?: string): Observable<AccountEntity> {
        return from(this.findOne({ where: { email: `${email}` }, relations: ['account'] })).pipe(
            map((user: UserEntity) => {

                if (!user) {
                    console.log('no account found');

                    return undefined;
                }

                if (!user.account) {
                    console.log('no account found');

                    return undefined;
                }

                return user.account;
            }));
    }


    public updateUser(data: UserDto): Observable<UserEntity> {
        return from(this.save(data)).pipe(
            map((acc: UserEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public addUser(data: UserDto): Observable<UserEntity> {
        return from(this.save(data)).pipe(
            map((acc: UserEntity) => {

                if (!acc) {
                    console.log('no account found');

                    return undefined;
                }

                return acc;
            }));
    }

    public deleteUser(id: string): Observable<boolean> {
        return from(this.delete({ id: id })).pipe(
            map((deleteResult: DeleteResult) => {

                if (!deleteResult) {
                    console.log('Failed to delete');

                    return undefined;
                }

                return true;
            }));
    }

    public getAll(moduleQueryDto: UserQueryDto): Observable<Array<UserEntity>> {

        const options: FindManyOptions<UserEntity> = { where: plainToClass(UserEntity, moduleQueryDto) };
        const filter = {};

        for (let [key, value] of Object.entries(moduleQueryDto)) {
            filter[key] = value;
        }

        return from(this.find({ where: filter, relations: ['account'] })).pipe(
            map((accounts: Array<UserEntity>) => {

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

    public getUser(id?: string): Observable<UserEntity> {
        return from(this.findOne({ where: { id: id }, relations: ['account'] })).pipe(
            map((account: UserEntity) => {

                if (!account) {
                    console.log('no module found');

                    return undefined;
                }

                return account;
            }));
    }

}
