import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { Device } from "./Device";
import { Sector } from "./Sector";

@Index("Scheme_file_key", ["file"], { unique: true })
@Index("Scheme_pkey", ["id"], { unique: true })
@Entity("Scheme", { schema: "public" })
export class Scheme {
  @Column("character varying", { primary: true, name: "id", length: 255 })
  id: string;

  @Column("character varying", { name: "file", unique: true, length: 255 })
  file: string;

  @Column("character varying", { name: "name", length: 50 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("date", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @ManyToOne(
    () => Device,
    device => device.schemes,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  device: Device;

  @ManyToOne(
    () => Sector,
    sector => sector.schemes
  )
  @JoinColumn([{ name: "sectorId", referencedColumnName: "id" }])
  sector3: Sector;

  @OneToMany(
    () => Sector,
    sector => sector.schemeDetail
  )
  sectors: Sector[];

  @OneToMany(
    () => Sector,
    sector => sector.scheme
  )
  sectors2: Sector[];
}
