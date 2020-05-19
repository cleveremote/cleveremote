import { Column, Entity, Index, JoinColumn, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { TransceiverEntity } from "./transceiver.entity";
import { GroupViewEntity } from "./groupView.entity";

@Index("module_pkey", ["id"], { unique: true })
@Entity("Module", { schema: "public" })
export class ModuleEntity {
  @Column("character varying", {
    primary: true,
    name: "id",
    length: 255
  })
  public id: string;

  @Column("character varying", { name: "port", length: 2 })
  public port: string;

  @Column("character varying", { name: "status", length: 255 })
  public status: string;

  @Column("character varying", { name: "applyfunction", length: 255 })
  public applyFunction: string;

  @Column("character varying", { name: "suffix", length: 255 })
  public suffix: string;

  @Column("character varying", { name: "prefix", length: 255 })
  public prefix: string;

  @Column("character varying", { name: "description", length: 255 })

  @Column("character varying", { name: "name", length: 255 })
  public name: string;

  @Column("character varying", { name: "transceiverId", length: 255 })
  public transceiverId: string;

  @ManyToMany(
    () => GroupViewEntity,
    groupView => groupView.modules
  )
  @JoinTable({
    name: "AssGroupViewModule",
    joinColumns: [{ name: "moduleId", referencedColumnName: "id" }],
    inverseJoinColumns: [
      { name: "groupId", referencedColumnName: "id" }
    ],
    schema: "public"
  })
  public groupViews: Array<GroupViewEntity>;

  @ManyToOne(
    () => TransceiverEntity,
    transceiver => transceiver.modules,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "transceiverId", referencedColumnName: "id" }
  ])
  public transceiver: TransceiverEntity | null;

}
