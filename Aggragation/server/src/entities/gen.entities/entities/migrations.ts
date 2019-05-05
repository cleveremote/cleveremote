import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";


@Entity("migrations",{schema:"public" } )
export class migrations {

    @PrimaryGeneratedColumn({
        type:"integer", 
        name:"id"
        })
    id:number;
        

    @Column("bigint",{ 
        nullable:false,
        name:"timestamp"
        })
    timestamp:string;
        

    @Column("character varying",{ 
        nullable:false,
        name:"name"
        })
    name:string;
        
}
