import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Transceiver } from "./Transceiver";

@Index("transceiver_config_pkey", ["configId"], { unique: true })
@Entity("transceiver_config", { schema: "public" })
export class TransceiverConfig {
  @Column("character varying", {
    primary: true,
    name: "config_id",
    length: 255
  })
  configId: string;

  @Column("json", { name: "configuration" })
  configuration: object;

  @Column("character varying", { name: "status", length: 255 })
  status: string;

  @ManyToOne(
    () => Transceiver,
    transceiver => transceiver.transceiverConfigs,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    { name: "transceiver_id", referencedColumnName: "transceiverId" }
  ])
  transceiver: Transceiver;

  @ManyToOne(
    () => Transceiver,
    transceiver => transceiver.transceiverConfigs2
  )
  @JoinColumn([
    { name: "transceiver_id", referencedColumnName: "transceiverId" }
  ])
  transceiver2: Transceiver;
}
