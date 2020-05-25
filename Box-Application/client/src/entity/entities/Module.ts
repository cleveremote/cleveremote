import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne
} from "typeorm";
import { GroupView } from "./GroupView";
import { Transceiver } from "./Transceiver";

@Index("Module_pkey", ["moduleId"], { unique: true })
@Entity("Module", { schema: "public" })
export class Module {
  @Column("varchar", { primary: true, name: "moduleId", length: 255 })
  moduleId: string;

  @Column("varchar", { name: "port", length: 2 })
  port: string;

  @Column("varchar", { name: "status", length: 255 })
  status: string;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @ManyToMany(
    () => GroupView,
    groupView => groupView.modules
  )
  groupViews: GroupView[];

  @ManyToOne(
    () => Transceiver,
    transceiver => transceiver.modules,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "transceiverId", referencedColumnName: "transceiverId" }
  ])
  transceiver: Transceiver;

  @ManyToOne(
    () => Transceiver,
    transceiver => transceiver.modules2
  )
  @JoinColumn([
    { name: "transceiverId", referencedColumnName: "transceiverId" }
  ])
  transceiver2: Transceiver;
}
