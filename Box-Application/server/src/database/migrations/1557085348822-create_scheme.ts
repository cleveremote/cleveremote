import {MigrationInterface, QueryRunner} from "typeorm";

export class createScheme1557085348822 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Scheme(
            schemeId VARCHAR (255) PRIMARY KEY,
            file VARCHAR (255) UNIQUE NOT NULL,
            name VARCHAR (50) UNIQUE NOT NULL,
            description TEXT,
            deviceId VARCHAR (255) NOT NULL,
            FOREIGN KEY (deviceId) REFERENCES Device(deviceId) ON DELETE CASCADE
           );`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Scheme;`);
        
    }

}
