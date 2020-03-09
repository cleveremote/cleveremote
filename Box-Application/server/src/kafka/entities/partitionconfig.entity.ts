import { BaseEntity, Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { DeviceEntity } from "./device.entity";

@Entity("partitionConfig", { schema: "public" })
export class PartitionConfig {

    @Column("character varying", {
        nullable: false,
        primary: true,
        length: 255,
        name: "configId"
    })
    public configId: string;

    @Column("integer", {
        nullable: false,
        name: "startRange"
    })
    public startRange: number;

    @Column("integer", {
        nullable: false,
        name: "endRange"
    })
    public endRange: number;

    @ManyToOne(type => DeviceEntity, device => device.partitionConfigs, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'deviceId' })
    public device: DeviceEntity | null;

}
