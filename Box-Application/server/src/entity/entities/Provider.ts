import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";

@Index("Provider_pkey", ["providerId"], { unique: true })
@Index("Provider_providerUid_key", ["providerUid"], { unique: true })
@Entity("Provider", { schema: "public" })
export class Provider {
  @Column("character varying", {
    primary: true,
    name: "providerId",
    length: 255
  })
  providerId: string;

  @Column("character varying", { name: "provider", length: 50 })
  provider: string;

  @Column("character varying", {
    name: "providerUid",
    unique: true,
    length: 255
  })
  providerUid: string;

  @ManyToOne(
    () => User,
    user => user.providers,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "userId", referencedColumnName: "userId" }])
  user: User;

  @ManyToOne(
    () => User,
    user => user.providers2
  )
  @JoinColumn([{ name: "userId", referencedColumnName: "userId" }])
  user2: User;
}
