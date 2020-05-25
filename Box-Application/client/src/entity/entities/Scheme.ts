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
@Index("Scheme_pkey", ["schemeId"], { unique: true })
@Entity("Scheme", { schema: "public" })
export class Scheme {
  @Column("varchar", { primary: true, name: "schemeId", length: 255 })
  schemeId: string;

  @Column("varchar", { name: "file", unique: true, length: 255 })
  file: string;

  @Column("varchar", { name: "name", length: 50 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @ManyToOne(
    () => Device,
    device => device.schemes,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  device: Device;

  @ManyToOne(
    () => Scheme,
    scheme => scheme.schemes,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "parentScheme", referencedColumnName: "schemeId" }])
  parentScheme: Scheme;

  @OneToMany(
    () => Scheme,
    scheme => scheme.parentScheme
  )
  schemes: Scheme[];

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
