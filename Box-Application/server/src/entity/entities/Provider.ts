import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Users } from "./Users";

@Index("provider_pkey", ["providerId"], { unique: true })
@Index("provider_provider_uid_key", ["providerUid"], { unique: true })
@Entity("provider", { schema: "public" })
export class Provider {
  @Column("character varying", {
    primary: true,
    name: "provider_id",
    length: 255
  })
  providerId: string;

  @Column("character varying", { name: "provider", length: 50 })
  provider: string;

  @Column("character varying", {
    name: "provider_uid",
    unique: true,
    length: 255
  })
  providerUid: string;

  @ManyToOne(
    () => Users,
    users => users.providers,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([{ name: "user_id", referencedColumnName: "userId" }])
  user: Users;

  @ManyToOne(
    () => Users,
    users => users.providers2
  )
  @JoinColumn([{ name: "user_id", referencedColumnName: "userId" }])
  user2: Users;
}
