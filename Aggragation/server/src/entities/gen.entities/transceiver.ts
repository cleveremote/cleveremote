import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {transceiver_config} from "./transceiver_config";
import {device} from "./device";


@Entity("transceiver",{schema:"public" } )
@Index("transceiver_name_key",["name",],{unique:true})
export class transceiver {

    @Column("character varying",{ 
        nullable:false,
        primary:true,
        length:255,
        name:"transceiver_id"
        })
    transceiver_id:string;
        

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
        

    @Column("character varying",{ 
        nullable:false,
        length:255,
        name:"address"
        })
    address:string;
        

    @Column("character varying",{ 
        nullable:false,
        length:255,
        name:"type"
        })
    type:string;
        

   
    @ManyToOne(type=>transceiver_config, transceiver_config=>transceiver_config.transceivers,{  nullable:false,onDelete: 'CASCADE', })
    @JoinColumn({ name:'config_id'})
    config:transceiver_config | null;


   
    @ManyToOne(type=>transceiver, transceiver=>transceiver.transceivers,{onDelete: 'CASCADE'})
    @JoinColumn({ name:'coordinator_id'})
    coordinator:transceiver | null;


   
    @ManyToOne(type=>device, device=>device.transceivers,{  nullable:false,onDelete: 'CASCADE' })
    @JoinColumn({ name:'device_id'})
    device:device | null;


   
    @OneToMany(type=>transceiver, transceiver=>transceiver.coordinator,{  nullable:false,onDelete: 'CASCADE' , })
    transceivers:transceiver[] | null;
    
}
