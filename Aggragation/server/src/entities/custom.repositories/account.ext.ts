import { EntityRepository, Repository } from "typeorm";
import { users } from "../gen.entities/users";
import * as bcrypt from 'bcrypt-nodejs';
import { Observable, from } from "rxjs";
import { account } from "../gen.entities/account";
import { map } from "rxjs/operators";

@EntityRepository(account)
export class AccountExt extends Repository<account> {

    public getAccount(): Observable<boolean> {
        return from(this.findOne({ relations: ['devices', 'users'] })).pipe(map((acc: account) => {

            if (!acc) {
                console.log('no account found');

                return false;
            }

            if (acc.devices.length === 0) {
                console.log('No devices');

                return false;
            }

            return true;
        }));
    }

}
