import {MigrationInterface, QueryRunner} from "typeorm";

export class createUser1556374316998 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "User"(
            "userId" VARCHAR (255) PRIMARY KEY,
            "firstName" VARCHAR (50) UNIQUE NOT NULL,
            "lastName" VARCHAR (50) UNIQUE NOT NULL,
            "email" VARCHAR (255) UNIQUE NOT NULL,
            "phone" VARCHAR (50) UNIQUE NOT NULL,
            "password" VARCHAR (512) UNIQUE NOT NULL,
            "accountId" VARCHAR (255) NOT NULL REFERENCES "Account"("accountId") ON DELETE CASCADE,
            FOREIGN KEY ("accountId") REFERENCES "Account" ("accountId")
           );`);  
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE User;`);
    }

}
