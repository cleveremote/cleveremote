import {MigrationInterface, QueryRunner} from "typeorm";

export class createSector1557085348825 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "AssGroupViewModule"(
            "assId" VARCHAR (255) PRIMARY KEY,
            "groupId" VARCHAR (255) NOT NULL REFERENCES "GroupView"("groupId") ON DELETE CASCADE,
            FOREIGN KEY ("groupId") REFERENCES "GroupView" ("groupId"),
            "moduleId" VARCHAR (255) NOT NULL REFERENCES "Module"("moduleId") ON DELETE CASCADE,
            FOREIGN KEY ("moduleId") REFERENCES "Module" ("moduleId")
           );`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE AssGroupViewModule;`);
    }

}
