import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { TransceiverEntity } from "./transceiver.entity";
import { SchemeEntity } from "./scheme.entity";
import { SectorEntity } from "./sector.entity";
import { AssGroupViewModuleEntity } from "./assGroupViewModule.entity";

@Index("module_pkey", ["moduleId"], { unique: true })
@Entity("Module", { schema: "public" })
export class ModuleEntity {
  @Column("character varying", {
    primary: true,
    name: "moduleId",
    length: 255
  })
  public moduleId: string;

  @Column("character varying", { name: "port", length: 2 })
  public port: string;

  @Column("character varying", { name: "status", length: 255 })
  public status: string;

  @Column("character varying", { name: "name", length: 255 })
  public name: string;

  @Column("character varying", { name: "transceiverId", length: 255 })
  public transceiverId: string;

  @OneToMany(
    () => AssGroupViewModuleEntity,
    assGroupViewModule => assGroupViewModule.module
  )
  public assGroupViewModules: Array<AssGroupViewModuleEntity>;

  @ManyToOne(
    type => TransceiverEntity,
    transceiver => transceiver.modules,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "transceiverId", referencedColumnName: "transceiverId" }
  ])
  public transceiver: TransceiverEntity  | null;

}
