import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { GroupView } from "./GroupView";
import { Module } from "./Module";

@Index("AssGroupViewModule_pkey", ["assId"], { unique: true })
@Entity("AssGroupViewModule", { schema: "public" })
export class AssGroupViewModule {
  @Column("character varying", { primary: true, name: "assId", length: 255 })
  assId: string;

  @ManyToOne(
    () => GroupView,
    groupView => groupView.assGroupViewModules,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "groupId", referencedColumnName: "groupId" }])
  group: GroupView;

  @ManyToOne(
    () => GroupView,
    groupView => groupView.assGroupViewModules2
  )
  @JoinColumn([{ name: "groupId", referencedColumnName: "groupId" }])
  group2: GroupView;

  @ManyToOne(
    () => Module,
    module => module.assGroupViewModules,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "moduleId", referencedColumnName: "moduleId" }])
  module: Module;

  @ManyToOne(
    () => Module,
    module => module.assGroupViewModules2
  )
  @JoinColumn([{ name: "moduleId", referencedColumnName: "moduleId" }])
  module2: Module;
}
