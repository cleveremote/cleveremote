import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany
} from "typeorm";
import { Module } from "./Module";
import { Device } from "./Device";
import { Sector } from "./Sector";

@Index("GroupView_pkey", ["groupId"], { unique: true })
@Entity("GroupView", { schema: "public" })
export class GroupView {
  @Column("character varying", { primary: true, name: "groupId", length: 255 })
  groupId: string;

  @Column("character varying", { name: "name", length: 255 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @ManyToMany(
    () => Module,
    module => module.groupViews
  )
  @JoinTable({
    name: "AssGroupViewModule",
    joinColumns: [{ name: "groupId", referencedColumnName: "groupId" }],
    inverseJoinColumns: [{ name: "moduleId", referencedColumnName: "id" }],
    schema: "public"
  })
  modules: Module[];

  @ManyToOne(
    () => Device,
    device => device.groupViews,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  device: Device;

  @ManyToOne(
    () => Sector,
    sector => sector.groupViews
  )
  @JoinColumn([{ name: "sectorId", referencedColumnName: "id" }])
  sector2: Sector;

  @OneToMany(
    () => Sector,
    sector => sector.group
  )
  sectors: Sector[];
}
