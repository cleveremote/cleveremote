import { Column, Entity, Index, OneToMany } from "typeorm";
import { Device } from "./Device";
import { User } from "./User";

@Index("Account_name_key", ["name"], { unique: true })
@Entity("Account")
export class Account {
  @Column("text", { primary: true, name: "accountId", unique: true })
  accountId: string;

  @Column("text", { name: "name", unique: true })
  name: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("integer", { name: "activated", nullable: true })
  activated: number | null;

  @Column("text", { name: "updatedAt", nullable: true })
  updatedAt: string | null;

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
