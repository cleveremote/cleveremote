import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne
} from "typeorm";
import { DeviceEntity } from "./device.entity";
import { SectorEntity } from "./sector.entity";

@Index("scheme_file_name_key", ["file"], { unique: true })
@Index("scheme_name_key", ["name"], { unique: true })
@Index("scheme_pkey", ["id"], { unique: true })
@Entity("Scheme", { schema: "public" })
export class SchemeEntity {
  @Column("varchar", {
    primary: true,
    name: "id",
    length: 255
  })
  public id: string;

  @Column("varchar", { name: "file", unique: true, length: 255 })
  public file: string;

  @Column("varchar", { name: "name", unique: true, length: 50 })
  public name: string;

  @Column("text", { name: "description", nullable: true })
  public description: string | null;

  @Column("varchar", { name: "sectorId", unique: true, length: 255 })
  public sectorId: string;

  @Column("varchar", { name: "deviceId", unique: true, length: 255 })
  public deviceId: string;

  @ManyToOne(
    () => DeviceEntity,
    device => device.schemes,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "id" }])
  public device: DeviceEntity;

  @OneToOne(
    () => SectorEntity,
    sector => sector.schemeDetail
  )
  public sector: SectorEntity;

  @OneToMany(
    () => SectorEntity,
    sector => sector.scheme, { cascade: true, onDelete: 'CASCADE' }
  )
  public sectors: Array<SectorEntity>;
}
