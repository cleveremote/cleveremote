import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { Account } from "./Account";
import { Transceiver } from "./Transceiver";
import { Scheme } from "./Scheme";
import { GroupView } from "./GroupView";
import { PartitionConfig } from "./PartitionConfig";

@Index("device_accountid_idx", ["accountId"], {})
@Index("Device_name_key", ["name"], { unique: true })
@Entity("Device")
export class Device {
  @Column("text", { primary: true, name: "deviceId", unique: true })
  deviceId: string;

  @Column("text", { name: "name", unique: true })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("text", { name: "accountId", nullable: true })
  accountId: string | null;

  @Column("text", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @Column("integer", { name: "default", nullable: true })
  default: number | null;

  @ManyToOne(
    () => Account,
    account => account.devices
  )
  @JoinColumn([{ name: "accountId", referencedColumnName: "accountId" }])
  account: Account;

  @ManyToOne(
    () => Account,
    account => account.devices2
  )
  @JoinColumn([{ name: "accountId", referencedColumnName: "accountId" }])
  account2: Account;

  @OneToMany(
    () => Transceiver,
    transceiver => transceiver.device
  )
  transceivers: Transceiver[];

  @OneToMany(
    () => Scheme,
    scheme => scheme.device
  )
  schemes: Scheme[];

  @OneToMany(
    () => GroupView,
    groupView => groupView.device
  )
  groupViews: GroupView[];

  @OneToMany(
    () => PartitionConfig,
    partitionConfig => partitionConfig.device
  )
  partitionConfigs: PartitionConfig[];
}
