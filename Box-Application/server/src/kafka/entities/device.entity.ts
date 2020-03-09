import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { AccountEntity } from "../../entities/gen.entities/account.entity";
import { PartitionConfig } from "./partitionconfig.entity";
import { SchemeEntity } from "../../xbee/entities/scheme.entity";
import { TransceiverEntity } from "../../xbee/entities/transceiver.entity";

@Index("device_pkey", ["deviceId"], { unique: true })
@Index("device_name_key", ["name"], { unique: true })
@Entity("device", { schema: "public" })
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

  @ManyToOne(
    () => AccountEntity,
    account => account.devices,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "accountId", referencedColumnName: "accountId" }])
  public account: AccountEntity;

  @ManyToOne(
    () => AccountEntity,
    account => account.devices
  )

  @OneToMany(
    () => PartitionConfig,
    partitionConfig => partitionConfig.device
  )
  public partitionConfigs: Array<PartitionConfig>;

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
