import {MigrationInterface, QueryRunner} from "typeorm";

export class createAccount1556374301832 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Account(
            account_id VARCHAR (255) PRIMARY KEY,
            name VARCHAR (50) UNIQUE NOT NULL,
            description TEXT,
            device_id VARCHAR (255) NOT NULL REFERENCES Device(device_id) ON DELETE CASCADE,
            FOREIGN KEY (device_id) REFERENCES Device (device_id)
           );`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Account;`);
    }

}
