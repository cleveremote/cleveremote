import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import { Account } from "./Account";
import { Provider } from "./Provider";

@Index("User_phone_key", ["phone"], { unique: true })
@Index("User_password_key", ["password"], { unique: true })
@Index("User_lastName_key", ["lastName"], { unique: true })
@Index("User_firstName_key", ["firstName"], { unique: true })
@Index("User_email_key", ["email"], { unique: true })
@Entity("User")
export class User {
  @Column("text", { primary: true, name: "userId", unique: true })
  userId: string;

  @Column("text", { name: "firstName", unique: true })
  firstName: string;

  @Column("text", { name: "lastName", unique: true })
  lastName: string;

  @Column("text", { name: "email", unique: true })
  email: string;

  @Column("text", { name: "phone", unique: true })
  phone: string;

  @Column("text", { name: "password", unique: true })
  password: string;

  @Column("text", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @ManyToOne(
    () => Account,
    account => account.users
  )
  @JoinColumn([{ name: "accountId", referencedColumnName: "accountId" }])
  account: Account;

  @ManyToOne(
    () => Account,
    account => account.users2
  )
  @JoinColumn([{ name: "accountId", referencedColumnName: "accountId" }])
  account2: Account;

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
}
