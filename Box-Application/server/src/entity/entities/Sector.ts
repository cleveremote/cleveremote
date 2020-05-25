import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Scheme } from "./Scheme";
import { GroupView } from "./GroupView";

@Entity("Sector")
export class Sector {
  @Column("text", { primary: true, name: "id", unique: true })
  id: string;

  @Column("text", { name: "name" })
  name: string;

  @Column("text", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @OneToMany(
    () => Scheme,
    scheme => scheme.sector3
  )
  schemes: Scheme[];

  @ManyToOne(
    () => Scheme,
    scheme => scheme.sectors
  )
  @JoinColumn([{ name: "schemeDetailId", referencedColumnName: "id" }])
  schemeDetail: Scheme;

  @ManyToOne(
    () => Scheme,
    scheme => scheme.sectors2
  )
  @JoinColumn([{ name: "schemeId", referencedColumnName: "id" }])
  scheme: Scheme;

  @ManyToOne(
    () => GroupView,
    groupView => groupView.sectors
  )
  @JoinColumn([{ name: "groupId", referencedColumnName: "groupId" }])
  group: GroupView;

  @OneToMany(
    () => GroupView,
    groupView => groupView.sector
  )
  groupViews: GroupView[];
}
