import {MigrationInterface, QueryRunner} from "typeorm";

export class createDevice1556374301832 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "Device"(
            "deviceId" VARCHAR (255) PRIMARY KEY,
            "name" VARCHAR (50) UNIQUE NOT NULL,
            "description" TEXT,
            "accountId" VARCHAR (255) REFERENCES "Account"("accountId"),
            FOREIGN KEY ("accountId") REFERENCES "Account" ("accountId")
           );`);
        
           await queryRunner.query(`CREATE INDEX device_accountid_idx ON public."Device" ("accountId");`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX device_accountid_idx ;`);
        await queryRunner.query(`DROP TABLE Device;`);
        
        
    }

}
