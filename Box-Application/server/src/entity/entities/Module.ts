import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Sector } from "./Sector";
import { Transceiver } from "./Transceiver";

@Index("Module_pkey", ["moduleId"], { unique: true })
@Entity("Module", { schema: "public" })
export class Module {
  @Column("character varying", { primary: true, name: "moduleId", length: 255 })
  moduleId: string;

  @Column("character varying", { name: "port", length: 2 })
  port: string;

  @Column("character varying", { name: "status", length: 255 })
  status: string;

  @Column("character varying", { name: "name", length: 255 })
  name: string;

  @ManyToOne(
    () => Sector,
    sector => sector.modules,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "sectorId", referencedColumnName: "sectorId" }])
  sector: Sector;

  @ManyToOne(
    () => Sector,
    sector => sector.modules2
  )
  @JoinColumn([{ name: "sectorId", referencedColumnName: "sectorId" }])
  sector2: Sector;

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
