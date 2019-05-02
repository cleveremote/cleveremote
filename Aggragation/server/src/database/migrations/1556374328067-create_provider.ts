import {MigrationInterface, QueryRunner} from "typeorm";

export class createProvider1556374328067 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Provider(
            provider_id VARCHAR (255) PRIMARY KEY,
            user_id VARCHAR (255) NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
            provider VARCHAR (50) NOT NULL,
            provider_uid VARCHAR (255) UNIQUE NOT NULL,
            FOREIGN KEY (user_id) REFERENCES Users (user_id)
           );`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Provider;`);
    }

}
