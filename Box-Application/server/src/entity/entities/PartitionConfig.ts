import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Device } from "./Device";

@Index("PartitionConfig_pkey", ["configId"], { unique: true })
@Entity("PartitionConfig", { schema: "public" })
export class PartitionConfig {
  @Column("character varying", { primary: true, name: "configId", length: 255 })
  configId: string;

  @Column("integer", { name: "startRange" })
  startRange: number;

  @Column("integer", { name: "endRange" })
  endRange: number;

  @ManyToOne(
    () => Device,
    device => device.partitionConfigs,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  device: Device;
}
