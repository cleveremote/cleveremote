import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { Module } from "./Module";
import { Scheme } from "./Scheme";

@Index("Sector_pkey", ["sectorId"], { unique: true })
@Entity("Sector", { schema: "public" })
export class Sector {
  @Column("character varying", { primary: true, name: "sectorId", length: 255 })
  sectorId: string;

  @Column("character varying", { name: "name", length: 255 })
  name: string;

  @OneToMany(
    () => Module,
    module => module.sector
  )
  modules: Module[];

  @OneToMany(
    () => Module,
    module => module.sector2
  )
  modules2: Module[];

  @ManyToOne(
    () => Scheme,
    scheme => scheme.sectors,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "schemeId", referencedColumnName: "schemeId" }])
  scheme: Scheme;

  @ManyToOne(
    () => Scheme,
    scheme => scheme.sectors2
  )
  @JoinColumn([{ name: "schemeId", referencedColumnName: "schemeId" }])
  scheme2: Scheme;
}
