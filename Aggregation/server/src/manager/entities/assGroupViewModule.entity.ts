import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { GroupViewEntity } from "./groupView.entity";
import { ModuleEntity } from "./module.entity";

@Index("AssGroupViewModule_pkey", ["assId"], { unique: true })
@Entity("AssGroupViewModule", { schema: "public" })
export class AssGroupViewModuleEntity {
  @Column("character varying", { primary: true, name: "assId", length: 255 })
  assId: string;

  @Column("character varying", { primary: true, name: "groupId", length: 255 })
  groupId: string;

  @Column("character varying", { primary: true, name: "moduleId", length: 255 })
  moduleId: string;

  @ManyToOne(
    () => GroupViewEntity,
    groupView => groupView.assGroupViewModules,
    { onDelete: "CASCADE", cascade: true }
  )
  @JoinColumn([{ name: "groupId", referencedColumnName: "groupId" }])
  group: GroupViewEntity;

  @ManyToOne(
    () => ModuleEntity,
    module => module.assGroupViewModules,
    { onDelete: "CASCADE", cascade: true }
  )
  @JoinColumn([{ name: "moduleId", referencedColumnName: "moduleId" }])
  module: ModuleEntity;
}
