import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {device} from "./device";
import {transceiver_config} from "./transceiver_config";


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
        
    @ManyToOne(type=>transceiver, transceiver=>transceiver.transceivers,{ onDelete: 'CASCADE' })
    @JoinColumn({ name:'coordinator_id'})
    coordinator:transceiver | null;

    @ManyToOne(type=>device, device=>device.transceivers,{  nullable:false,onDelete: 'CASCADE' })
    @JoinColumn({ name:'device_id'})
    device:device | null;

    @OneToMany(type=>transceiver, transceiver=>transceiver.coordinator,{ onDelete: 'CASCADE' })
    transceivers:transceiver[];
    
    @OneToMany(type=>transceiver_config, transceiver_config=>transceiver_config.transceiver,{ onDelete: 'CASCADE' , cascade: true })
    transceiver_configs:transceiver_config[];
    
}
