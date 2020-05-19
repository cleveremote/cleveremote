import { Column, Entity, Index } from "typeorm";

@Index(
  "synchronization_pk",
  ["action", "entity", "entityId", "target", "topic"],
  { unique: true }
)
@Entity("Synchronization", { schema: "public" })
export class Synchronization {
  @Column("character varying", { primary: true, name: "target", length: 255 })
  target: string;

  @Column("character varying", { primary: true, name: "entity", length: 255 })
  entity: string;

  @Column("character varying", { primary: true, name: "entityId", length: 255 })
  entityId: string;

  @Column("character varying", { primary: true, name: "action", length: 255 })
  action: string;

  @Column("json", { name: "data" })
  data: object;

  @Column("numeric", { name: "size" })
  size: string;

  @Column("character varying", { primary: true, name: "topic", length: 255 })
  topic: string;
}
