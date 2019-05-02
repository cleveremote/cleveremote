import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {account} from "./account";


@Entity("device",{schema:"public" } )
@Index("device_name_key",["name",],{unique:true})
export class device {

    @Column("character varying",{ 
        nullable:false,
        primary:true,
        length:255,
        name:"device_id"
        })
    device_id:string;
        

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
        

   
    @OneToMany(type=>account, account=>account.device,{ onDelete: 'CASCADE'})
    accounts:account[];
    
}
