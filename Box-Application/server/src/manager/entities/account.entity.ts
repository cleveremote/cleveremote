import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {DeviceEntity} from "./device.entity";
import {UserEntity} from "./user.entity";

@Entity("Account",{schema:"public" } )
@Index("account_pkey", ["accountId"], { unique: true })
@Index("account_name_key", ["name"], { unique: true })
export class AccountEntity {

    @Column("character varying",{ 
        nullable:false,
        primary:true,
        length:255,
        name:"accountId"
        })
    accountId:string;
        

    @Column("character varying",{ 
        nullable:false,
        unique: true,
        length:50,
        name:"name"
        })
    name:string;
        

    @Column("text",{ 
        nullable:true,
        name:"description"
        })
    description:string | null;

    
    // @Column("boolean",{ 
    //     nullable:true,
    //     name:"activated"
    //     })
    // activated:boolean;

   
    @OneToMany(type=>DeviceEntity, device=>device.account,{ onDelete: 'CASCADE', cascade: true  })
    devices:Array<DeviceEntity>;
   
    @OneToMany(type=>UserEntity, users=>users.account,{ onDelete: 'CASCADE', cascade: true })
    users:Array<UserEntity>;
    
}
