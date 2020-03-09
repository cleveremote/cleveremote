import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Device } from "./Device";

@Index("partition_config_pkey", ["configId"], { unique: true })
@Entity("partition_config", { schema: "public" })
export class PartitionConfig {
  @Column("character varying", {
    primary: true,
    name: "config_id",
    length: 255
  })
  configId: string;

  @Column("integer", { name: "start_range" })
  startRange: number;

  @Column("integer", { name: "end_range" })
  endRange: number;

  @ManyToOne(
    () => Device,
    device => device.partitionConfigs,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "device_id", referencedColumnName: "deviceId" }])
  device: Device;
}
