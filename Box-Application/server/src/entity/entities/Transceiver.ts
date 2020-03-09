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
import { TransceiverConfig } from "./TransceiverConfig";

@Index("transceiver_name_key", ["name"], { unique: true })
@Index("transceiver_pkey", ["transceiverId"], { unique: true })
@Entity("transceiver", { schema: "public" })
export class Transceiver {
  @Column("character varying", {
    primary: true,
    name: "transceiver_id",
    length: 255
  })
  transceiverId: string;

  @Column("character varying", { name: "name", unique: true, length: 50 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("character varying", { name: "address", length: 255 })
  address: string;

  @Column("character varying", { name: "type", length: 255 })
  type: string;

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
    () => Transceiver,
    transceiver => transceiver.transceivers,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "coordinator_id", referencedColumnName: "transceiverId" }
  ])
  coordinator: Transceiver;

  @OneToMany(
    () => Transceiver,
    transceiver => transceiver.coordinator
  )
  transceivers: Transceiver[];

  @ManyToOne(
    () => Device,
    device => device.transceivers,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "device_id", referencedColumnName: "deviceId" }])
  device: Device;

  @OneToMany(
    () => TransceiverConfig,
    transceiverConfig => transceiverConfig.transceiver
  )
  transceiverConfigs: TransceiverConfig[];

  @OneToMany(
    () => TransceiverConfig,
    transceiverConfig => transceiverConfig.transceiver2
  )
  transceiverConfigs2: TransceiverConfig[];
}
