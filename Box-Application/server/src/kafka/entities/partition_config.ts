import { BaseEntity, Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { Device } from "./device";


@Entity("partition_config", { schema: "public" })
export class PartitionConfig {

    @Column("character varying", {
        nullable: false,
        primary: true,
        length: 255,
        name: "config_id"
    })
    config_id: string;


    @Column("integer", {
        nullable: false,
        name: "start_range"
    })
    start_range: number;


    @Column("integer", {
        nullable: false,
        name: "end_range"
    })
    end_range: number;

    @ManyToOne(type => Device, device => device.partition_configs, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'device_id' })
    device: Device | null;

}
