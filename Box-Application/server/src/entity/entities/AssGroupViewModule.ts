import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { GroupView } from "./GroupView";
import { Module } from "./Module";

@Entity("AssGroupViewModule")
export class AssGroupViewModule {
  @Column("text", { primary: true, name: "groupId" })
  groupId: string;

  @Column("text", { primary: true, name: "moduleId" })
  moduleId: string;

  @Column("text", { name: "updatedat", nullable: true })
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
