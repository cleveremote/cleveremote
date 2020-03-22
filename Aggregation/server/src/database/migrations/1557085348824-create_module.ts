import {MigrationInterface, QueryRunner} from "typeorm";

export class createModule1557085348824 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "Module"(
            "moduleId" VARCHAR (255) PRIMARY KEY,
            "port" VARCHAR (2) NOT NULL,
            "status" VARCHAR (255) NOT NULL,
            "name" VARCHAR (255) NOT NULL,
            "transceiverId" VARCHAR (255) NOT NULL REFERENCES "Transceiver"("transceiverId") ON DELETE CASCADE,
            FOREIGN KEY ("transceiverId") REFERENCES "Transceiver"("transceiverId")
           );`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Module;`);
    }

}
