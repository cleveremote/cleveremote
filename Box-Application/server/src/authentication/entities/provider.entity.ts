import { BaseEntity, Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { UserEntity } from "./user.entity";


@Entity("Provider", { schema: "public" })
@Index("provider_pkey", ["providerId"], { unique: true })
@Index("provider_provider_uid_key", ["providerUid"], { unique: true })
export class ProviderEntity {

    @Column("varchar", {
        nullable: false,
        primary: true,
        length: 255,
        name: "providerId"
    })
    providerId: string;

    @Column("varchar", { name: "userId", unique: true, length: 255 })
    public userId: string;


    @ManyToOne(type => UserEntity, users => users.providers, { nullable: false, onDelete: 'CASCADE', })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user: UserEntity | null;


    @Column("varchar", {
        nullable: false,
        length: 50,
        name: "provider"
    })
    provider: string;


    @Column("varchar", {
        nullable: false,
        unique: true,
        length: 255,
        name: "providerUid"
    })
    providerUid: string;

}
