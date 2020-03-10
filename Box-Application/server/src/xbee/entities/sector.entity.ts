import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { SchemeEntity } from "./scheme.entity";
import { ModuleEntity } from "./module.entity";

@Index("sector_pkey", ["sectorId"], { unique: true })
@Entity("Sector", { schema: "public" })
export class SectorEntity {
  @Column("character varying", {
    primary: true,
    name: "sectorId",
    length: 255
  })
  public sectorId: string;

  @OneToMany(
    () => ModuleEntity,
    module => module.sector
  )
  public modules: Array<ModuleEntity>;

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
