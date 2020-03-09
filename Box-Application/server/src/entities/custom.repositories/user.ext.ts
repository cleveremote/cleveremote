import { EntityRepository, Repository } from "typeorm";
import { UserEntity } from "../gen.entities/user.entity";
import * as bcrypt from 'bcrypt-nodejs';
import { Observable, from } from "rxjs";
import { map } from "rxjs/operators";
import { AccountEntity } from "../gen.entities/account.entity";
import { ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";

@EntityRepository(UserEntity)
export class UserExt extends Repository<UserEntity> implements ISynchronize {

    public synchronize(data: ISynchronizeParams): any {
        throw new Error("Method not implemented.");
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

    public getUser(userId: string, done: any): void {
        this.findOne({ where: { user_id: userId }, relations: ['account'] }).then((user: UserEntity) => {

            if (!user) {
                console.log('no user found');

                return done(undefined, false);
            }

            return done(undefined, user);
        });
    }

    public getUserByEmail(email?: string): Observable<boolean> {
        return from(this.findOne({ where: { email: "nadime.yahyaoui@gmail.com" }, relations: ['account', 'account.devices', 'account.devices.config'] })).pipe(
            map((acc: UserEntity) => {

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

}
