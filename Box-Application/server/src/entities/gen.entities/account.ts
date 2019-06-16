import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {device} from "./device";
import {users} from "./users";


@Entity("account",{schema:"public" } )
@Index("account_name_key",["name",],{unique:true})
export class account {

    @Column("character varying",{ 
        nullable:false,
        primary:true,
        length:255,
        name:"account_id"
        })
    account_id:string;
        

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
        

   
    @OneToMany(type=>device, device=>device.account,{ onDelete: 'CASCADE', cascade: true  })
    devices:device[];
   
    @OneToMany(type=>users, users=>users.account,{ onDelete: 'CASCADE', cascade: true })
    users:users[];
    
}
