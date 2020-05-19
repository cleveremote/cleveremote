import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { Provider } from "./Provider";
import { Account } from "./Account";

@Index("User_email_key", ["email"], { unique: true })
@Index("User_firstName_key", ["firstName"], { unique: true })
@Index("User_lastName_key", ["lastName"], { unique: true })
@Index("User_password_key", ["password"], { unique: true })
@Index("User_phone_key", ["phone"], { unique: true })
@Index("User_pkey", ["userId"], { unique: true })
@Entity("User", { schema: "public" })
export class User {
  @Column("character varying", { primary: true, name: "userId", length: 255 })
  userId: string;

  @Column("character varying", { name: "firstName", unique: true, length: 50 })
  firstName: string;

  @Column("character varying", { name: "lastName", unique: true, length: 50 })
  lastName: string;

  @Column("character varying", { name: "email", unique: true, length: 255 })
  email: string;

  @Column("character varying", { name: "phone", unique: true, length: 50 })
  phone: string;

  @Column("character varying", { name: "password", unique: true, length: 512 })
  password: string;

  @Column("date", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @OneToMany(
    () => Provider,
    provider => provider.user
  )
  providers: Provider[];

  @OneToMany(
    () => Provider,
    provider => provider.user2
  )
  providers2: Provider[];

  @ManyToOne(
    () => Account,
    account => account.users,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "accountId", referencedColumnName: "accountId" }])
  account: Account;

  @ManyToOne(
    () => Account,
    account => account.users2
  )
  @JoinColumn([{ name: "accountId", referencedColumnName: "accountId" }])
  account2: Account;
}
