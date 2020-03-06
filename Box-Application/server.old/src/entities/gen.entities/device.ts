import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {Account} from "./account";
import {PartitionConfig} from "./partition_config";
import {Transceiver} from "./transceiver";


@Entity("device",{schema:"public" } )
@Index("device_name_key",["name",],{unique:true})
export class Device {

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
   
    @ManyToOne(type=>Account, account=>account.devices,{  nullable:false,onDelete: 'CASCADE' })
    @JoinColumn({ name:'account_id'})
    account:Account | null;
   
    @OneToMany(type=>PartitionConfig, partition_config=>partition_config.device,{ onDelete: 'CASCADE', cascade: true })
    partition_configs:PartitionConfig[];

    @OneToMany(type=>Transceiver, transceiver=>transceiver.device,{ onDelete: 'CASCADE', cascade: true })
    transceivers:Transceiver[];
    
}
