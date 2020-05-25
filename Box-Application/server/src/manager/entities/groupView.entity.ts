import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable
} from "typeorm";

import { SectorEntity } from "./sector.entity";
import { DeviceEntity } from "./device.entity";
import { ModuleEntity } from "./module.entity";

@Index("GroupView_pkey", ["id"], { unique: true })
@Entity("GroupView", { schema: "public" })
export class GroupViewEntity {
  @Column("varchar", { primary: true, name: "groupId", length: 255 })
  id: string;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @ManyToMany(
    () => ModuleEntity,
    module => module.groupViews, { cascade: true }
  )
  modules: ModuleEntity[];

  @Column("varchar", { name: "deviceId", unique: true, length: 255 })
  public deviceId: string;

  @Column("varchar", { name: "sectorId", unique: true, length: 255 })
  public sectorId: string;

  @ManyToOne(
    () => DeviceEntity,
    device => device.groupViews,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "id" }])
  device: DeviceEntity;

  @OneToMany(
    () => SectorEntity,
    sector => sector.groupView
  )
  sectors: SectorEntity[];

}
