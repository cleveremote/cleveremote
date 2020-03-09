import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { TransceiverEntity } from "./transceiver.entity";

@Index("module_pkey", ["moduleId"], { unique: true })
@Entity("module", { schema: "public" })
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

  @Column("character varying", { name: "transceiverId", length: 2 })
  public transceiverId: string;

  @ManyToOne(
    () => TransceiverEntity,
    transceiver => transceiver.modules,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "transceiverId", referencedColumnName: "transceiverId" }
  ])
  public transceiver: TransceiverEntity;

}
