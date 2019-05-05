import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {account} from "./account";
import {provider} from "./provider";


@Entity("users",{schema:"public" } )
@Index("users_email_key",["email",],{unique:true})
@Index("users_first_name_key",["first_name",],{unique:true})
@Index("users_last_name_key",["last_name",],{unique:true})
@Index("users_number_phone_key",["number_phone",],{unique:true})
@Index("users_password_key",["password",],{unique:true})
export class users {

    @Column("character varying",{ 
        nullable:false,
        primary:true,
        length:255,
        name:"user_id"
        })
    user_id:string;
        

    @Column("character varying",{ 
        nullable:false,
        unique: true,
        length:50,
        name:"first_name"
        })
    first_name:string;
        

    @Column("character varying",{ 
        nullable:false,
        unique: true,
        length:50,
        name:"last_name"
        })
    last_name:string;
        

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
        name:"number_phone"
        })
    number_phone:string;
        

    @Column("character varying",{ 
        nullable:false,
        unique: true,
        length:512,
        name:"password"
        })
    password:string;
        

   
    @ManyToOne(type=>account, account=>account.users,{  nullable:false,onDelete: 'CASCADE', })
    @JoinColumn({ name:'account_id'})
    account_:account | null;
   
    @OneToMany(type=>provider, provider=>provider.user,{ onDelete: 'CASCADE' , })
    providers:provider[];
    
}
