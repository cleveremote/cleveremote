import {MigrationInterface, QueryRunner} from "typeorm";

export class createUser1556374316998 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Users(
            user_id VARCHAR (255) PRIMARY KEY,
            first_name VARCHAR (50) UNIQUE NOT NULL,
            last_name VARCHAR (50) UNIQUE NOT NULL,
            email VARCHAR (255) UNIQUE NOT NULL,
            number_phone VARCHAR (50) UNIQUE NOT NULL,
            password VARCHAR (512) UNIQUE NOT NULL,
            account_id VARCHAR (255) NOT NULL REFERENCES Account(account_id) ON DELETE CASCADE,
            FOREIGN KEY (account_id) REFERENCES Account (account_id)
           );`);  
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE User;`);
    }

}
