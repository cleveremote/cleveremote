import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { GroupView } from "./GroupView";
import { Module } from "./Module";

@Index("assgroupviewmodule_pk", ["groupId", "moduleId"], { unique: true })
@Entity("AssGroupViewModule", { schema: "public" })
export class AssGroupViewModule {
  @Column("character varying", { primary: true, name: "groupId", length: 255 })
  groupId: string;

  @Column("character varying", { primary: true, name: "moduleId", length: 255 })
  moduleId: string;

  @Column("date", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @ManyToOne(
    () => GroupView,
    groupView => groupView.assGroupViewModules
  )
  @JoinColumn([{ name: "groupId", referencedColumnName: "groupId" }])
  group: GroupView;

  @ManyToOne(
    () => Module,
    module => module.assGroupViewModules
  )
  @JoinColumn([{ name: "moduleId", referencedColumnName: "id" }])
  module: Module;
}
