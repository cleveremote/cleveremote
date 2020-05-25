import { Column, Entity, Index, JoinColumn, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { TransceiverEntity } from "./transceiver.entity";
import { GroupViewEntity } from "./groupView.entity";

@Index("module_pkey", ["id"], { unique: true })
@Entity("Module", { schema: "public" })
export class ModuleEntity {
  @Column("varchar", {
    primary: true,
    name: "id",
    length: 255
  })
  public id: string;

  @Column("varchar", { name: "port", length: 2 })
  public port: string;

  @Column("varchar", { name: "status", length: 255 })
  public status: string;

  @Column("varchar", { name: "applyfunction", length: 255 })
  public applyFunction: string;

  @Column("varchar", { name: "suffix", length: 255 })
  public suffix: string;

  @Column("varchar", { name: "prefix", length: 255 })
  public prefix: string;

  @Column("varchar", { name: "description", length: 255 })

  @Column("varchar", { name: "name", length: 255 })
  public name: string;

  @Column("varchar", { name: "transceiverId", length: 255 })
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
