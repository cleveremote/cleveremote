import {MigrationInterface, QueryRunner} from "typeorm";

export class createTransceiverConfig1557085348820 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Transceiver_config(
            config_id VARCHAR (255) PRIMARY KEY,
            configuration json NOT NULL,
            status VARCHAR (255) NOT NULL,
            transceiver_id VARCHAR (255) NOT NULL REFERENCES Transceiver(transceiver_id) ON DELETE CASCADE,
            FOREIGN KEY (transceiver_id) REFERENCES Transceiver (transceiver_id)
           );`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Transceiver_config;`);
    }

}
