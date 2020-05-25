import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { Module } from "./Module";
import { Device } from "./Device";

@Index("Transceiver_name_key", ["name"], { unique: true })
@Index("Transceiver_pkey", ["transceiverId"], { unique: true })
@Entity("Transceiver", { schema: "public" })
export class Transceiver {
  @Column("varchar", {
    primary: true,
    name: "transceiverId",
    length: 255
  })
  transceiverId: string;

  @Column("varchar", { name: "name", unique: true, length: 50 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("varchar", { name: "address", length: 255 })
  address: string;

  @Column("varchar", { name: "type", length: 255 })
  type: string;

  @Column(TEXT, { name: "configuration" })
  configuration: object;

  @OneToMany(
    () => Module,
    module => module.transceiver
  )
  modules: Module[];

  @OneToMany(
    () => Module,
    module => module.transceiver2
  )
  modules2: Module[];

  @ManyToOne(
    () => Device,
    device => device.transceivers,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  device: Device;
}
