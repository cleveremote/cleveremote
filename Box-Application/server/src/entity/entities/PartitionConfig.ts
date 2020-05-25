import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Device } from "./Device";

@Entity("PartitionConfig")
export class PartitionConfig {
  @Column("text", { primary: true, name: "configId", unique: true })
  configId: string;

  @Column("integer", { name: "startRange" })
  startRange: number;

  @Column("integer", { name: "endRange" })
  endRange: number;

  @Column("text", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @ManyToOne(
    () => Device,
    device => device.partitionConfigs
  )
  @JoinColumn([{ name: "deviceId", referencedColumnName: "deviceId" }])
  device: Device;
}
