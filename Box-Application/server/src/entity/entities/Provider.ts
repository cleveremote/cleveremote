import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";

@Index("Provider_providerUid_key", ["providerUid"], { unique: true })
@Entity("Provider")
export class Provider {
  @Column("text", { primary: true, name: "providerId", unique: true })
  providerId: string;

  @Column("text", { name: "provider" })
  provider: string;

  @Column("text", { name: "providerUid", unique: true })
  providerUid: string;

  @Column("text", { name: "updatedat", nullable: true })
  updatedat: string | null;

  @ManyToOne(
    () => User,
    user => user.providers
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
