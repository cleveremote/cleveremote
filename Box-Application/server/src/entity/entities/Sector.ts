import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Scheme } from "./Scheme";

@Index("sector_pkey", ["sectorId"], { unique: true })
@Entity("sector", { schema: "public" })
export class Sector {
  @Column("character varying", {
    primary: true,
    name: "sector_id",
    length: 255
  })
  sectorId: string;

  @Column("character varying", { name: "name", length: 255 })
  name: string;

  @ManyToOne(
    () => Scheme,
    scheme => scheme.sectors,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "scheme_id", referencedColumnName: "schemeId" }])
  scheme: Scheme;

  @ManyToOne(
    () => Scheme,
    scheme => scheme.sectors2
  )
  @JoinColumn([{ name: "scheme_id", referencedColumnName: "schemeId" }])
  scheme2: Scheme;
}
