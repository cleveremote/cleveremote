import {MigrationInterface, QueryRunner} from "typeorm";

export class createDevice1556370861576 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Device(
            device_id VARCHAR (255) PRIMARY KEY,
            name VARCHAR (50) UNIQUE NOT NULL,
            description TEXT
           );`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Device;`);
        
    }

}
