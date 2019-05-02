import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId, EntityRepository, AbstractRepository, Repository} from "typeorm";
import { users } from "../gen.entities/users";
import * as bcrypt from 'bcrypt-nodejs';
import { Observable } from "rxjs";


/**
 * First type of custom repository - extends abstract repository.
 */
@EntityRepository(users)
export class userExt extends Repository<users> {

    public generateHash(password: any) :string {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
    };
    
    // checking if password is valid
    public validPassword (password: string,entityPassword:string) {
        return bcrypt.compareSync(password, entityPassword);
    };


    public authenticate(req: any, email: any, password: any, done: any){
        this.findOne({ where: { email: email }, relations: ['account'] }).then((user:users) => {
                        
            if (!user) {
                return done(null, false, console.log('no user found'));
            }

            if (!this.validPassword(password,user.password)) {
                return done(null, false, console.log('wrong password'));
            }

            return done(null, user);
        });
    }

    public getUser(userId: string,done: any){
        this.findOne({ where: { user_id: userId }, relations: ['account'] }).then((user:users) => {
                        
            if (!user) {
                return done(null, false, console.log('no user found'));
            }

            return done(null, user);
        });
    }

}
