import {MigrationInterface, QueryRunner} from "typeorm";

export class createSector1557085348823 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Sector(
            sectorId VARCHAR (255) PRIMARY KEY,
            name VARCHAR (255) NOT NULL,
            schemeId VARCHAR (255) NOT NULL REFERENCES Scheme(schemeId) ON DELETE CASCADE,
            FOREIGN KEY (schemeId) REFERENCES Scheme (schemeId)
           );`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Sector;`);
    }

}
