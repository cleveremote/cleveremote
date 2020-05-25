import { Column, Entity, Index } from "typeorm";

@Index("synchronization_pk", ["action", "entity", "entityId", "target", "topic"], {
  unique: true
})
@Entity("Synchronization", { schema: "public" })
export class SynchronizationEntity {
  @Column("varchar", { primary: true, name: "target", length: 255 })
  target: string;

  @Column("varchar", { primary: true, name: "topic", length: 255 })
  topic: string;

  @Column("varchar", { primary: true, name: "entity", length: 255 })
  entity: string;

  @Column("varchar", { primary: true, name: "entityId", length: 255 })
  entityId: string;

  @Column("varchar", { primary: true, name: "action", length: 255 })
  action: string;

  @Column('varchar', { name: "data" })
  data: object;

  @Column("numeric", { name: "size" })
  size: string;
}
