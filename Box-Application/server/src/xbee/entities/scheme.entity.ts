import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { DeviceEntity } from "../../kafka/entities/device.entity";
import { SectorEntity } from "./sector.entity";

@Index("scheme_file_name_key", ["fileName"], { unique: true })
@Index("scheme_name_key", ["name"], { unique: true })
@Index("scheme_pkey", ["schemeId"], { unique: true })
@Entity("scheme", { schema: "public" })
export class SchemeEntity {
  @Column("character varying", {
    primary: true,
    name: "schemeId",
    length: 255
  })
  public schemeId: string;

  @Column("character varying", { name: "fileName", unique: true, length: 255 })
  public fileName: string;

  @Column("character varying", { name: "name", unique: true, length: 50 })
  public name: string;

  @Column("text", { name: "description", nullable: true })
  public description: string | null;

  @ManyToOne(
    () => DeviceEntity,
    device => device.schemes,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  public device: DeviceEntity;

  @OneToMany(
    () => SectorEntity,
    sector => sector.scheme
  )
  public sectors: Array<SectorEntity>;
}
