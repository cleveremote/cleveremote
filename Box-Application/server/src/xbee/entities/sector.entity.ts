import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { SchemeEntity } from "./scheme.entity";

@Index("sector_pkey", ["sectorId"], { unique: true })
@Entity("sector", { schema: "public" })
export class SectorEntity {
  @Column("character varying", {
    primary: true,
    name: "sectorId",
    length: 255
  })
  public sectorId: string;

  @Column("character varying", { name: "name", length: 255 })
  public name: string;

  @ManyToOne(
    () => SchemeEntity,
    scheme => scheme.sectors,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "schemeId", referencedColumnName: "schemeId" }])
  public scheme: SchemeEntity;
}
