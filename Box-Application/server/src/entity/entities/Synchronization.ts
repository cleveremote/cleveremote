import { Column, Entity } from "typeorm";

@Entity("Synchronization")
export class Synchronization {
  @Column("text", { primary: true, name: "target" })
  target: string;

  @Column("text", { primary: true, name: "entity" })
  entity: string;

  @Column("text", { primary: true, name: "entityId" })
  entityId: string;

  @Column("text", { primary: true, name: "action" })
  action: string;

  @Column("text", { name: "data" })
  data: string;

  @Column("double", { name: "size" })
  size: number;

  @Column("text", { primary: true, name: "topic" })
  topic: string;
}
