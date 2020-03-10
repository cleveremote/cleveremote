import {MigrationInterface, QueryRunner} from "typeorm";

export class createPartitionConfig1556374301833 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "PartitionConfig"(
            "configId" VARCHAR (255) PRIMARY KEY,
            "startRange" integer NOT NULL,
            "endRange" integer NOT NULL,
            "deviceId" VARCHAR (255) NOT NULL,
            FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE CASCADE
           );`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE partition_config;`);
    }

}
