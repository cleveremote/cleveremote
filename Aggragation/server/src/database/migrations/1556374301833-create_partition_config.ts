import {MigrationInterface, QueryRunner} from "typeorm";

export class createPartitionConfig1556374301833 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE partition_config(
            config_id VARCHAR (255) PRIMARY KEY,
            start_range integer NOT NULL,
            end_range integer NOT NULL,
            device_id VARCHAR (255) NOT NULL,
            FOREIGN KEY (device_id) REFERENCES Device(device_id) ON DELETE CASCADE
           );`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE partition_config;`);
    }

}
