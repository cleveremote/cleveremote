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
  @Column("character varying", {
    primary: true,
    name: "transceiverId",
    length: 255
  })
  public id: string;

  @Column("character varying", { name: "name", unique: true, length: 50 })
  public name: string;

  @Column("text", { name: "description", nullable: true })
  public description: string | null;

  @Column("character varying", { name: "address", length: 255 })
  public address: string;

  @Column("character varying", { name: "type", length: 255 })
  public type: string;

  @Column("character varying", { name: "deviceId", length: 255 })
  public deviceId: string;

  @Column("character varying", { name: "status", length: 255 })
  public status: string;

  @Column("json", { name: "configuration" })
  public configuration: object;

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
