import { Column, Entity, Index, OneToMany } from "typeorm";
import { Device } from "./Device";
import { Users } from "./Users";

@Index("account_pkey", ["accountId"], { unique: true })
@Index("account_name_key", ["name"], { unique: true })
@Entity("account", { schema: "public" })
export class Account {
  @Column("character varying", {
    primary: true,
    name: "account_id",
    length: 255
  })
  accountId: string;

  @Column("character varying", { name: "name", unique: true, length: 50 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @OneToMany(
    () => Device,
    device => device.account
  )
  devices: Device[];

  @OneToMany(
    () => Device,
    device => device.account2
  )
  devices2: Device[];

  @OneToMany(
    () => Users,
    users => users.account
  )
  users: Users[];

  @OneToMany(
    () => Users,
    users => users.account2
  )
  users2: Users[];
}
