import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { Account } from "./Account";
import { PartitionConfig } from "./PartitionConfig";
import { Scheme } from "./Scheme";
import { Transceiver } from "./Transceiver";

@Index("device_pkey", ["deviceId"], { unique: true })
@Index("device_name_key", ["name"], { unique: true })
@Entity("device", { schema: "public" })
export class Device {
  @Column("character varying", {
    primary: true,
    name: "device_id",
    length: 255
  })
  deviceId: string;

  @Column("character varying", { name: "name", unique: true, length: 50 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @ManyToOne(
    () => Account,
    account => account.devices,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  account: Account;

  @ManyToOne(
    () => Account,
    account => account.devices2
  )
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  account2: Account;

  @OneToMany(
    () => PartitionConfig,
    partitionConfig => partitionConfig.device
  )
  partitionConfigs: PartitionConfig[];

  @OneToMany(
    () => Scheme,
    scheme => scheme.device
  )
  schemes: Scheme[];

  @OneToMany(
    () => Transceiver,
    transceiver => transceiver.device
  )
  transceivers: Transceiver[];
}
