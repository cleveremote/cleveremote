import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { SchemeEntity } from "./scheme.entity";
import { ModuleEntity } from "./module.entity";
import { GroupViewEntity } from "./groupView.entity";

@Index("sector_pkey", ["id"], { unique: true })
@Entity("Sector", { schema: "public" })
export class SectorEntity {
  @Column("character varying", {
    primary: true,
    name: "id",
    length: 255
  })
  public id: string;

  @Column("character varying", { name: "name", length: 255 })
  public name: string;

  @Column("character varying", { name: "schemeId", length: 255 })
  public schemeId: string;

  @Column("character varying", { name: "schemeDetailId", length: 255 })
  public schemeDetailId: string;

  @Column("character varying", { name: "groupId", length: 255 })
  public groupViewId: string;

  @ManyToOne(
    () => SchemeEntity,
    scheme => scheme.sectors,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "schemeId", referencedColumnName: "id" }])
  public scheme: SchemeEntity;

  @ManyToOne(
    () => GroupViewEntity,
    groupView => groupView.sectors, { onDelete: 'CASCADE', cascade: true }
  )
  @JoinColumn([{ name: "groupId", referencedColumnName: "id" }])
  public groupView: GroupViewEntity;

  @OneToOne(
    () => SchemeEntity,
    scheme => scheme.sector
  )
  @JoinColumn([{ name: "schemeDetailId", referencedColumnName: "id" }])
  public schemeDetail: SchemeEntity;
}
