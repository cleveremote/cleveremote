import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { Sector } from "./Sector";
import { Device } from "./Device";

@Index("Scheme_file_key", ["file"], { unique: true })
@Entity("Scheme")
export class Scheme {
  @Column("text", { primary: true, name: "id", unique: true })
  id: string;

  @Column("text", { name: "file", unique: true })
  file: string;

  @Column("text", { name: "name" })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("text", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @ManyToOne(
    () => Sector,
    sector => sector.schemes
  )
  @JoinColumn([{ name: "sectorId", referencedColumnName: "id" }])
  sector3: Sector;

  @ManyToOne(
    () => Device,
    device => device.schemes
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  device: Device;

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
