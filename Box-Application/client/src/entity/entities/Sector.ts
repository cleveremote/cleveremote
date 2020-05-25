import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { GroupView } from "./GroupView";
import { Scheme } from "./Scheme";

@Index("Sector_pkey", ["sectorId"], { unique: true })
@Entity("Sector", { schema: "public" })
export class Sector {
  @Column("varchar", { primary: true, name: "sectorId", length: 255 })
  sectorId: string;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @ManyToOne(
    () => GroupView,
    groupView => groupView.sectors
  )
  @JoinColumn([{ name: "groupId", referencedColumnName: "groupId" }])
  group: GroupView;

  @ManyToOne(
    () => GroupView,
    groupView => groupView.sectors2
  )
  @JoinColumn([{ name: "groupId", referencedColumnName: "groupId" }])
  group2: GroupView;

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
