import { Column, Entity } from "typeorm";

@Entity("migrations")
export class Migrations {
  @Column("integer", { primary: true, name: "id" })
  id: number;

  @Column("integer", { name: "timestamp" })
  timestamp: number;

  @Column("text", { name: "name" })
  name: string;
}
