import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Sector } from "./Sector";
import { Device } from "./Device";
import { AssGroupViewModule } from "./AssGroupViewModule";

@Entity("GroupView")
export class GroupView {
  @Column("text", { primary: true, name: "groupId", unique: true })
  groupId: string;

  @Column("text", { name: "name" })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @OneToMany(
    () => Sector,
    sector => sector.group
  )
  sectors: Sector[];

  @ManyToOne(
    () => Sector,
    sector => sector.groupViews
  )
  @JoinColumn([{ name: "sectorId", referencedColumnName: "id" }])
  sector: Sector;

  @ManyToOne(
    () => Device,
    device => device.groupViews
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  device: Device;

  @OneToMany(
    () => AssGroupViewModule,
    assGroupViewModule => assGroupViewModule.group
  )
  assGroupViewModules: AssGroupViewModule[];
}
