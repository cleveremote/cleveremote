import { EntityRepository, Repository } from "typeorm";
import { users } from "../gen.entities/users";
import * as bcrypt from 'bcrypt-nodejs';
import { Observable, from } from "rxjs";
import { account } from "../gen.entities/account";
import { map } from "rxjs/operators";
import { IAccount } from "../interfaces/entities.interface";

@EntityRepository(account)
export class AccountExt extends Repository<account> {

    public isBoxInitialized(): Observable<boolean> {
        return from(this.find({ relations: ['devices', 'users', 'devices.partition_configs'] })).pipe(
            map((acc: Array<account>) => {

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

}
