import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {transceiver} from "./transceiver";


@Entity("transceiver_config",{schema:"public" } )
export class transceiver_config {

    @Column("character varying",{ 
        nullable:false,
        primary:true,
        length:255,
        name:"config_id"
        })
    config_id:string;
        

    @Column("json",{ 
        nullable:false,
        name:"configuration"
        })
    configuration:Object;
        

    @Column("character varying",{ 
        nullable:false,
        length:255,
        name:"status"
        })
    status:string;
        
    @ManyToOne(type=>transceiver, transceiver=>transceiver.transceiver_configs,{  nullable:false,onDelete: 'CASCADE', })
    @JoinColumn({ name:'transceiver_id'})
    transceiver:transceiver | null;

}
