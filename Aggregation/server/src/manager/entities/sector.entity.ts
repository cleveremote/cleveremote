import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { SchemeEntity } from "./scheme.entity";
import { ModuleEntity } from "./module.entity";
import { GroupViewEntity } from "./groupView.entity";

@Index("sector_pkey", ["sectorId"], { unique: true })
@Entity("Sector", { schema: "public" })
export class SectorEntity {
  @Column("character varying", {
    primary: true,
    name: "sectorId",
    length: 255
  })
  public sectorId: string;

  @Column("character varying", { name: "name", length: 255 })
  public name: string;

  @Column("character varying", { name: "schemeId", length: 255 })
  public schemeId: string;

  @ManyToOne(
    () => SchemeEntity,
    scheme => scheme.sectors,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "schemeId", referencedColumnName: "schemeId" }])
  public scheme: SchemeEntity;

  @ManyToOne(
    () => GroupViewEntity,
    groupView => groupView.sectors, { onDelete: 'CASCADE', cascade: true }
  )
  @JoinColumn([{ name: "groupId", referencedColumnName: "groupId" }])
  group: GroupViewEntity;
}
