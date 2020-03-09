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

@Index("scheme_file_name_key", ["fileName"], { unique: true })
@Index("scheme_name_key", ["name"], { unique: true })
@Index("scheme_pkey", ["schemeId"], { unique: true })
@Entity("scheme", { schema: "public" })
export class Scheme {
  @Column("character varying", {
    primary: true,
    name: "scheme_id",
    length: 255
  })
  schemeId: string;

  @Column("character varying", { name: "file_name", unique: true, length: 255 })
  fileName: string;

  @Column("character varying", { name: "name", unique: true, length: 50 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @ManyToOne(
    () => Device,
    device => device.schemes,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "device_id", referencedColumnName: "deviceId" }])
  device: Device;

  @OneToMany(
    () => Sector,
    sector => sector.scheme
  )
  sectors: Sector[];

  @OneToMany(
    () => Sector,
    sector => sector.scheme2
  )
  sectors2: Sector[];
}
