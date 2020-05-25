import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { ModuleEntity } from "./module.entity";
import { DeviceEntity } from "./device.entity";

@Index("transceiver_name_key", ["name"], { unique: true })
@Index("transceiver_pkey", ["id"], { unique: true })
@Entity("Transceiver", { schema: "public" })
export class TransceiverEntity {
  @Column("varchar", {
    primary: true,
    name: "transceiverId",
    length: 255
  })
  public id: string;

  @Column("varchar", { name: "name", unique: true, length: 50 })
  public name: string;

  @Column("text", { name: "description", nullable: true })
  public description: string | null;

  @Column("varchar", { name: "address", length: 255 })
  public address: string;

  @Column("integer", { name: "type", nullable: false })
  public type: number;

  @Column("varchar", { name: "deviceId", length: 255 })
  public deviceId: string;

  @Column("varchar", { name: "status", length: 255 })
  public status: string;

  @Column('varchar', { name: "configuration" })
  public configuration: string;

  @ManyToOne(
    () => TransceiverEntity,
    transceiver => transceiver.transceivers, { onDelete: 'CASCADE', cascade: true }
  )
  @JoinColumn([{ name: "pending", referencedColumnName: "id" }])
  public pending: TransceiverEntity;

  @OneToMany(
    () => TransceiverEntity,
    transceiver => transceiver.pending
  )
  public transceivers: Array<TransceiverEntity>;

  @OneToMany(
    () => ModuleEntity,
    module => module.transceiver, { onDelete: 'CASCADE', cascade: true }
  )
  public modules: Array<ModuleEntity>;

  @ManyToOne(
    () => DeviceEntity,
    device => device.transceivers,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "id" }])
  public device: DeviceEntity;

}
