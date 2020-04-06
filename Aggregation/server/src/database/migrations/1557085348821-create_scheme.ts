import {MigrationInterface, QueryRunner} from "typeorm";

export class createScheme1557085348821 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "Scheme"(
            "id" VARCHAR (255) PRIMARY KEY,
            "file" VARCHAR (255) UNIQUE NOT NULL,
            "name" VARCHAR (50) NOT NULL,
            "schemeId" VARCHAR (255),
            FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE CASCADE,
            "description" TEXT,
            "deviceId" VARCHAR (255),
            FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE CASCADE
           );`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Scheme;`);
        
    }

}
