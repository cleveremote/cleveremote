import {MigrationInterface, QueryRunner} from "typeorm";

export class createSector1557085348822 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "GroupView"(
            "groupId" VARCHAR (255) PRIMARY KEY,
            "name" VARCHAR (255) NOT NULL,
            "description" TEXT,
            "deviceId" VARCHAR (255),
            FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE CASCADE,
            "sectorId" VARCHAR (255),
            FOREIGN KEY ("sectorId") REFERENCES "Sector"("sectorId") ON DELETE CASCADE
           );`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE GroupView;`);
    }

}
