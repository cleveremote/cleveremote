import {MigrationInterface, QueryRunner} from "typeorm";

export class createPartitionConfig1556374301831 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE partition_config(
            config_id VARCHAR (255) PRIMARY KEY,
            start_range integer NOT NULL,
            end_range integer NOT NULL
           );`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE partition_config;`);
    }

}
