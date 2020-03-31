import {MigrationInterface, QueryRunner} from "typeorm";

export class createSector1557085348825 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "AssGroupViewModule" (
            "groupId" varchar(255) NOT NULL,
            "moduleId" varchar(255) NOT NULL,
            CONSTRAINT assgroupviewmodule_pk PRIMARY KEY ("groupId", "moduleId")
        );`);
        await queryRunner.query(`ALTER TABLE "AssGroupViewModule" ADD CONSTRAINT assgroupviewmodule_fk FOREIGN KEY ("moduleId") REFERENCES "Module"("moduleId");`);
        await queryRunner.query(`ALTER TABLE "AssGroupViewModule" ADD CONSTRAINT assgroupviewmodule_fk_1 FOREIGN KEY ("groupId") REFERENCES "GroupView"("groupId");`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE AssGroupViewModule;`);
    }

}