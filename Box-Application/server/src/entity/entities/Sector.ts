import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { GroupView } from "./GroupView";
import { Scheme } from "./Scheme";

@Index("Sector_pkey", ["id"], { unique: true })
@Entity("Sector", { schema: "public" })
export class Sector {
  @Column("character varying", { primary: true, name: "id", length: 255 })
  id: string;

  @Column("character varying", { name: "name", length: 255 })
  name: string;

  @Column("date", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @OneToMany(
    () => GroupView,
    groupView => groupView.sector2
  )
  groupViews: GroupView[];

  @OneToMany(
    () => Scheme,
    scheme => scheme.sector3
  )
  schemes: Scheme[];

  @ManyToOne(
    () => GroupView,
    groupView => groupView.sectors
  )
  @JoinColumn([{ name: "groupId", referencedColumnName: "groupId" }])
  group: GroupView;

  @ManyToOne(
    () => Scheme,
    scheme => scheme.sectors
  )
  @JoinColumn([{ name: "schemeDetailId", referencedColumnName: "id" }])
  schemeDetail: Scheme;

  @ManyToOne(
    () => Scheme,
    scheme => scheme.sectors2,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "schemeId", referencedColumnName: "id" }])
  scheme: Scheme;
}
