import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { DeviceEntity } from "./device.entity";
import { SectorEntity } from "./sector.entity";

@Index("scheme_file_name_key", ["file"], { unique: true })
@Index("scheme_name_key", ["name"], { unique: true })
@Index("scheme_pkey", ["schemeId"], { unique: true })
@Entity("Scheme", { schema: "public" })
export class SchemeEntity {
  @Column("character varying", {
    primary: true,
    name: "schemeId",
    length: 255
  })
  public schemeId: string;

  @Column("character varying", { name: "file", unique: true, length: 255 })
  public file: string;

  @Column("character varying", { name: "name", unique: true, length: 50 })
  public name: string;

  @Column("text", { name: "description", nullable: true })
  public description: string | null;

  @Column("character varying", { name: "parentScheme", unique: true, length: 255 })
  public parentScheme: string;

  @Column("character varying", { name: "deviceId", unique: true, length: 255 })
  public deviceId: string;

  @ManyToOne(
    () => DeviceEntity,
    device => device.schemes,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  public device: DeviceEntity;

  @OneToMany(
    () => SchemeEntity,
    scheme => scheme.parentscheme
  )
  public schemes: Array<SchemeEntity>;

  @ManyToOne(
    () => SchemeEntity,
    scheme => scheme.schemes,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "parentScheme", referencedColumnName: "schemeId" }])
  public parentscheme: SchemeEntity;

  @OneToMany(
    () => SectorEntity,
    sector => sector.scheme, { cascade: true, onDelete: 'CASCADE' }
  )
  public sectors: Array<SectorEntity>;
}
