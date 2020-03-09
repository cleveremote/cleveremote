import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {UserEntity} from "./user.entity";


@Entity("provider",{schema:"public" } )
@Index("provider_provider_uid_key",["providerUid",],{unique:true})
export class ProviderEntity {

    @Column("character varying",{ 
        nullable:false,
        primary:true,
        length:255,
        name:"providerId"
        })
    providerId:string;
        

   
    @ManyToOne(type=>UserEntity, users=>users.providers,{  nullable:false,onDelete: 'CASCADE', })
    @JoinColumn({ name:'userId'})
    user:UserEntity | null;


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
        name:"providerUid"
        })
    providerUid:string;
        
}
