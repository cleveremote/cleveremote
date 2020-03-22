import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";

import { AssGroupViewModuleEntity } from "./assGroupViewModule.entity";
import { SectorEntity } from "./sector.entity";
import { DeviceEntity } from "./device.entity";

@Index("GroupView_pkey", ["groupId"], { unique: true })
@Entity("GroupView", { schema: "public" })
export class GroupViewEntity {
  @Column("character varying", { primary: true, name: "groupId", length: 255 })
  groupId: string;

  @Column("character varying", { name: "name", length: 255 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @OneToMany(
    () => AssGroupViewModuleEntity,
    assGroupViewModule => assGroupViewModule.group
  )
  assGroupViewModules: AssGroupViewModuleEntity[];


  @ManyToOne(
    () => DeviceEntity,
    device => device.groupViews,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  device: DeviceEntity;

  @OneToMany(
    () => SectorEntity,
    sector => sector.group
  )
  sectors: SectorEntity[];

}
