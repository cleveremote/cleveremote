import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { ModuleEntity } from "./module.entity";
import { DeviceEntity } from "../../kafka/entities/device.entity";

@Index("transceiver_name_key", ["name"], { unique: true })
@Index("transceiver_pkey", ["transceiverId"], { unique: true })
@Entity("transceiver", { schema: "public" })
export class TransceiverEntity {
  @Column("character varying", {
    primary: true,
    name: "transceiver_id",
    length: 255
  })
  public transceiverId: string;

  @Column("character varying", { name: "name", unique: true, length: 50 })
  public name: string;

  @Column("text", { name: "description", nullable: true })
  public description: string | null;

  @Column("character varying", { name: "address", length: 255 })
  public address: string;

  @Column("character varying", { name: "type", length: 255 })
  public type: string;

  @Column("character varying", { name: "type", length: 255 })
  public deviceId: string;

  @OneToMany(
    () => ModuleEntity,
    module => module.transceiver
  )
  public modules: Array<ModuleEntity>;

  @ManyToOne(
    () => DeviceEntity,
    device => device.transceivers,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "device_id", referencedColumnName: "deviceId" }])
  public device: DeviceEntity;

}
