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

@Index("users_email_key", ["email"], { unique: true })
@Index("users_first_name_key", ["firstName"], { unique: true })
@Index("users_last_name_key", ["lastName"], { unique: true })
@Index("users_number_phone_key", ["numberPhone"], { unique: true })
@Index("users_password_key", ["password"], { unique: true })
@Index("users_pkey", ["userId"], { unique: true })
@Entity("users", { schema: "public" })
export class Users {
  @Column("character varying", { primary: true, name: "user_id", length: 255 })
  userId: string;

  @Column("character varying", { name: "first_name", unique: true, length: 50 })
  firstName: string;

  @Column("character varying", { name: "last_name", unique: true, length: 50 })
  lastName: string;

  @Column("character varying", { name: "email", unique: true, length: 255 })
  email: string;

  @Column("character varying", {
    name: "number_phone",
    unique: true,
    length: 50
  })
  numberPhone: string;

  @Column("character varying", { name: "password", unique: true, length: 512 })
  password: string;

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
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  account: Account;

  @ManyToOne(
    () => Account,
    account => account.users2
  )
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  account2: Account;
}
