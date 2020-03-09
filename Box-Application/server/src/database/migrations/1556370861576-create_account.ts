import {MigrationInterface, QueryRunner} from "typeorm";

export class createAccount1556370861576 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Account(
            accountId VARCHAR (255) PRIMARY KEY,
            name VARCHAR (50) UNIQUE NOT NULL,
            description TEXT,
            activated BOOLEAN
           );`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Account;`);
    }

}
