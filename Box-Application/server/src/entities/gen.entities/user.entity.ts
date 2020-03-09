import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {AccountEntity} from "./account.entity";
import {ProviderEntity} from "./provider.entity";


@Entity("users",{schema:"public" } )
@Index("users_email_key",["email",],{unique:true})
@Index("users_first_name_key",["firstName",],{unique:true})
@Index("users_last_name_key",["lastName",],{unique:true})
@Index("users_number_phone_key",["phone",],{unique:true})
@Index("users_password_key",["password",],{unique:true})
export class UserEntity {

    @Column("character varying",{ 
        nullable:false,
        primary:true,
        length:255,
        name:"userId"
        })
    userId:string;
        

    @Column("character varying",{ 
        nullable:false,
        unique: true,
        length:50,
        name:"firstName"
        })
    firstName:string;
        

    @Column("character varying",{ 
        nullable:false,
        unique: true,
        length:50,
        name:"lastName"
        })
    lastName:string;
        

    @Column("character varying",{ 
        nullable:false,
        unique: true,
        length:255,
        name:"email"
        })
    email:string;
        

    @Column("character varying",{ 
        nullable:false,
        unique: true,
        length:50,
        name:"phone"
        })
    phone:string;
        

    @Column("character varying",{ 
        nullable:false,
        unique: true,
        length:512,
        name:"password"
        })
    password:string;
        

   
    @ManyToOne(type=>AccountEntity, account=>account.users,{  nullable:false,onDelete: 'CASCADE' })
    @JoinColumn({ name:'accountId'})
    account:AccountEntity | null;
   
    @OneToMany(type=>ProviderEntity, provider=>provider.user,{ onDelete: 'CASCADE' })
    providers:Array<ProviderEntity>;
    
}
