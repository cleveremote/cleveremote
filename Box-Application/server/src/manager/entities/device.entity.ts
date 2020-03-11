import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { AccountEntity } from "./account.entity";
import { PartitionConfigEntity } from "./partitionconfig.entity";
import { SchemeEntity } from "./scheme.entity";
import { TransceiverEntity } from "./transceiver.entity";

@Index("device_pkey", ["deviceId"], { unique: true })
@Index("device_name_key", ["name"], { unique: true })
@Entity("Device", { schema: "public" })
export class DeviceEntity {
  @Column("character varying", {
    primary: true,
    name: "deviceId",
    length: 255
  })
  public deviceId: string;

  @Column("character varying", { name: "name", unique: true, length: 50 })
  public name: string;

  @Column("text", { name: "description", nullable: true })
  public description: string | null;

  @Column("character varying", { name: "accountId", unique: true, length: 255 })
  public accountId: string;

  @ManyToOne(
    () => AccountEntity,
    account => account.devices,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "accountId", referencedColumnName: "accountId" }])
  public account: AccountEntity;

  @OneToMany(
    () => PartitionConfigEntity,
    partitionConfig => partitionConfig.device
  )
  public partitionConfigs: Array<PartitionConfigEntity>;

  @OneToMany(
    () => SchemeEntity,
    scheme => scheme.device
  )
  public schemes: Array<SchemeEntity>;

  @OneToMany(
    () => TransceiverEntity,
    transceiver => transceiver.device
  )
  public transceivers: Array<TransceiverEntity>;
}
