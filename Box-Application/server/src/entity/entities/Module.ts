import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Transceiver } from "./Transceiver";

@Index("module_pkey", ["moduleId"], { unique: true })
@Entity("module", { schema: "public" })
export class Module {
  @Column("character varying", {
    primary: true,
    name: "module_id",
    length: 255
  })
  moduleId: string;

  @Column("character varying", { name: "port", length: 2 })
  port: string;

  @Column("character varying", { name: "status", length: 255 })
  status: string;

  @Column("character varying", { name: "name", length: 255 })
  name: string;

  @ManyToOne(
    () => Transceiver,
    transceiver => transceiver.modules,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "transceiver_id", referencedColumnName: "transceiverId" }
  ])
  transceiver: Transceiver;

  @ManyToOne(
    () => Transceiver,
    transceiver => transceiver.modules2
  )
  @JoinColumn([
    { name: "transceiver_id", referencedColumnName: "transceiverId" }
  ])
  transceiver2: Transceiver;
}
