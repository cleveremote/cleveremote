import { EntityRepository, Repository } from "typeorm";
import { users } from "../gen.entities/users";
import * as bcrypt from 'bcrypt-nodejs';
import { Observable } from "rxjs";

@EntityRepository(users)
export class UserExt extends Repository<users> {

    public generateHash(password: any): string {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
    }

    public validPassword(password: string, entityPassword: string): boolean {
        return bcrypt.compareSync(password, entityPassword);
    }

    public authenticate(req: any, mail: any, password: any, done: any): void {
        this.findOne({ where: { email: mail }, relations: ['account'] }).then((user: users) => {

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
        this.findOne({ where: { user_id: userId }, relations: ['account'] }).then((user: users) => {

            if (!user) {
                console.log('no user found');

                return done(undefined, false);
            }

            return done(undefined, user);
        });
    }

}
