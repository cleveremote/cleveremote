import {MigrationInterface, QueryRunner} from "typeorm";

export class createTransceiverConfig1557084449387 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Transceiver_config(
            config_id VARCHAR (255) PRIMARY KEY,
            configuration json NOT NULL,
            status VARCHAR (255) NOT NULL
           );`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Transceiver_config;`);
    }

}
