import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { PartitionConfigEntity } from "./partitionconfig.entity";
import { SchemeEntity } from "./scheme.entity";
import { TransceiverEntity } from "./transceiver.entity";
import { GroupViewEntity } from "./groupView.entity";
import { AccountEntity } from "../../authentication/entities/account.entity";

@Index("device_pkey", ["id"], { unique: true })
@Index("device_name_key", ["name"], { unique: true })
@Entity("Device", { schema: "public" })
export class DeviceEntity {
  @Column("varchar", {
    primary: true,
    name: "deviceId",
    length: 255
  })
  public id: string;

  @Column("varchar", { name: "name", unique: true, length: 50 })
  public name: string;

  @Column("text", { name: "description", nullable: true })
  public description: string | null;

  @Column("varchar", { name: "accountId", unique: true, length: 255 })
  public accountId: string;

  @ManyToOne(
    () => AccountEntity,
    account => account.devices,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "accountId", referencedColumnName: "id" }])
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

  @OneToMany(
    () => GroupViewEntity,
    groupView => groupView.device
  )
  groupViews: Array<GroupViewEntity>;
}
