import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { AssGroupViewModule } from "./AssGroupViewModule";
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

  @OneToMany(
    () => AssGroupViewModule,
    assGroupViewModule => assGroupViewModule.group
  )
  assGroupViewModules: AssGroupViewModule[];

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
