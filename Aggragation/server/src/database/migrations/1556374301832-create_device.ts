import {MigrationInterface, QueryRunner} from "typeorm";

export class createDevice1556374301832 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Device(
            device_id VARCHAR (255) PRIMARY KEY,
            name VARCHAR (50) UNIQUE NOT NULL,
            description TEXT,
            account_id VARCHAR (255) NOT NULL REFERENCES Account(account_id) ON DELETE CASCADE,
            FOREIGN KEY (account_id) REFERENCES Account (account_id),
            config_id VARCHAR (255) NOT NULL, 
            FOREIGN KEY (config_id) REFERENCES partition_config(config_id) ON DELETE CASCADE
           );`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Device;`);
        
    }

}
