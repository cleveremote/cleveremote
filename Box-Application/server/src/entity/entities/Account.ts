import { Column, Entity, Index, OneToMany } from "typeorm";
import { Device } from "./Device";
import { User } from "./User";

@Index("Account_pkey", ["accountId"], { unique: true })
@Index("Account_name_key", ["name"], { unique: true })
@Entity("Account", { schema: "public" })
export class Account {
  @Column("character varying", {
    primary: true,
    name: "accountId",
    length: 255
  })
  accountId: string;

  @Column("character varying", { name: "name", unique: true, length: 50 })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("boolean", { name: "activated", nullable: true })
  activated: boolean | null;

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
    () => User,
    user => user.account
  )
  users: User[];

  @OneToMany(
    () => User,
    user => user.account2
  )
  users2: User[];
}
