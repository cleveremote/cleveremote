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

@Index("Transceiver_pkey", ["transceiverId"], { unique: true })
@Entity("Transceiver", { schema: "public" })
export class Transceiver {
  @Column("character varying", {
    primary: true,
    name: "transceiverId",
    length: 255
  })
  transceiverId: string;

  @Column("character varying", { name: "name", length: 50 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("character varying", { name: "address", length: 255 })
  address: string;

  @Column("integer", { name: "type" })
  type: number;

  @Column("json", { name: "configuration" })
  configuration: object;

  @Column("character varying", { name: "status", nullable: true })
  status: string | null;

  @Column("date", { name: "updatedat", nullable: true })
  updatedat: string | null;

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

  @ManyToOne(
    () => Transceiver,
    transceiver => transceiver.transceivers
  )
  @JoinColumn([{ name: "pending", referencedColumnName: "transceiverId" }])
  pending: Transceiver;

  @OneToMany(
    () => Transceiver,
    transceiver => transceiver.pending
  )
  transceivers: Transceiver[];
}
