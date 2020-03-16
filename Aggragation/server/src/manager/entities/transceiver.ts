import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {Device} from "./device";
import {TransceiverConfig} from "./transceiver_config";


@Entity("transceiver",{schema:"public" } )
@Index("transceiver_name_key",["name",],{unique:true})
export class Transceiver {

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
        
    @ManyToOne(type=>Transceiver, transceiver=>transceiver.transceivers,{ onDelete: 'CASCADE' })
    @JoinColumn({ name:'coordinator_id'})
    coordinator:Transceiver | null;

    @ManyToOne(type=>Device, device=>device.transceivers,{  nullable:false,onDelete: 'CASCADE' })
    @JoinColumn({ name:'device_id'})
    device:Device | null;

    @OneToMany(type=>Transceiver, transceiver=>transceiver.coordinator,{ onDelete: 'CASCADE' })
    transceivers:Transceiver[];
    
    @OneToMany(type=>TransceiverConfig, transceiver_config=>transceiver_config.transceiver,{ onDelete: 'CASCADE' , cascade: true })
    transceiver_configs:TransceiverConfig[];
    
}
