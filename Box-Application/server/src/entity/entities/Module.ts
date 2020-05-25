import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Transceiver } from "./Transceiver";
import { AssGroupViewModule } from "./AssGroupViewModule";

@Entity("Module")
export class Module {
  @Column("text", { primary: true, name: "id", unique: true })
  id: string;

  @Column("text", { name: "port" })
  port: string;

  @Column("text", { name: "status" })
  status: string;

  @Column("text", { name: "name" })
  name: string;

  @Column("text", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @Column("text", { name: "prefix", nullable: true })
  prefix: string | null;

  @Column("text", { name: "suffix", nullable: true })
  suffix: string | null;

  @Column("text", { name: "applyfunction", nullable: true })
  applyfunction: string | null;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @ManyToOne(
    () => Transceiver,
    transceiver => transceiver.modules
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

  @OneToMany(
    () => AssGroupViewModule,
    assGroupViewModule => assGroupViewModule.module
  )
  assGroupViewModules: AssGroupViewModule[];
}
