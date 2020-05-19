import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { AssGroupViewModule } from "./AssGroupViewModule";
import { Transceiver } from "./Transceiver";

@Index("Module_pkey", ["id"], { unique: true })
@Entity("Module", { schema: "public" })
export class Module {
  @Column("character varying", { primary: true, name: "id", length: 255 })
  id: string;

  @Column("character varying", { name: "port", length: 2 })
  port: string;

  @Column("character varying", { name: "status", length: 255 })
  status: string;

  @Column("character varying", { name: "name", length: 255 })
  name: string;

  @Column("date", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @Column("character varying", { name: "prefix", nullable: true, length: 255 })
  prefix: string | null;

  @Column("character varying", { name: "suffix", nullable: true, length: 255 })
  suffix: string | null;

  @Column("character varying", {
    name: "applyfunction",
    nullable: true,
    length: 512
  })
  applyfunction: string | null;

  @Column("character varying", {
    name: "description",
    nullable: true,
    length: 255
  })
  description: string | null;

  @OneToMany(
    () => AssGroupViewModule,
    assGroupViewModule => assGroupViewModule.module
  )
  assGroupViewModules: AssGroupViewModule[];

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
