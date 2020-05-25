import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Device } from "./Device";
import { Module } from "./Module";

@Entity("Transceiver")
export class Transceiver {
  @Column("text", { primary: true, name: "transceiverId", unique: true })
  transceiverId: string;

  @Column("text", { name: "name" })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("text", { name: "address" })
  address: string;

  @Column("integer", { name: "type" })
  type: number;

  @Column("text", { name: "configuration" })
  configuration: string;

  @Column("text", { name: "status", nullable: true })
  status: string | null;

  @Column("text", { name: "updatedat", nullable: true })
  updatedat: string | null;

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

  @ManyToOne(
    () => Device,
    device => device.transceivers
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  device: Device;

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
}
