import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {User} from "./users";


@Entity("provider",{schema:"public" } )
@Index("provider_provider_uid_key",["provider_uid",],{unique:true})
export class Provider {

    @Column("character varying",{ 
        nullable:false,
        primary:true,
        length:255,
        name:"provider_id"
        })
    provider_id:string;
        

   
    @ManyToOne(type=>User, users=>users.providers,{  nullable:false,onDelete: 'CASCADE', })
    @JoinColumn({ name:'user_id'})
    user:User | null;


    @Column("character varying",{ 
        nullable:false,
        length:50,
        name:"provider"
        })
    provider:string;
        

    @Column("character varying",{ 
        nullable:false,
        unique: true,
        length:255,
        name:"provider_uid"
        })
    provider_uid:string;
        
}
