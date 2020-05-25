import { BaseEntity, Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { DeviceEntity } from "../../manager/entities/device.entity";
import { UserEntity } from "./user.entity";

@Entity("Account", { schema: "public" })
@Index("account_pkey", ["id"], { unique: true })
@Index("account_name_key", ["name"], { unique: true })
export class AccountEntity {

    @Column("varchar", {
        nullable: false,
        primary: true,
        length: 255,
        name: "accountId"
    })
    id: string;


    @Column("varchar", {
        nullable: false,
        unique: true,
        length: 50,
        name: "name"
    })
    name: string;


    @Column("text", {
        nullable: true,
        name: "description"
    })
    description: string | null;


    // @Column("boolean",{ 
    //     nullable:true,
    //     name:"activated"
    //     })
    // activated:boolean;


    @OneToMany(type => DeviceEntity, device => device.account, { cascade: true })
    devices: Array<DeviceEntity>;

    @OneToMany(type => UserEntity, users => users.account, { onDelete: 'CASCADE', cascade: true })
    users: Array<UserEntity>;

}
