import {MigrationInterface, QueryRunner} from "typeorm";

export class createProvider1556374328067 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Provider(
            providerId VARCHAR (255) PRIMARY KEY,
            userId VARCHAR (255) NOT NULL REFERENCES Users(userId) ON DELETE CASCADE,
            provider VARCHAR (50) NOT NULL,
            providerUid VARCHAR (255) UNIQUE NOT NULL,
            FOREIGN KEY (userId) REFERENCES Users (userId)
           );`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Provider;`);
    }

}
