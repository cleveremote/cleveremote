import {MigrationInterface, QueryRunner} from "typeorm";

export class createTransceiver1557085348819 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Transceiver(
            transceiverId VARCHAR (255) PRIMARY KEY,
            name VARCHAR (50) UNIQUE NOT NULL,
            description TEXT,
            address VARCHAR (255) NOT NULL,
            type VARCHAR (255) NOT NULL, 
            configuration json NOT NULL,
            FOREIGN KEY (coordinatorId) REFERENCES Transceiver(transceiverId) ON DELETE CASCADE,
            deviceId VARCHAR (255) NOT NULL,
            FOREIGN KEY (deviceId) REFERENCES Device(deviceId) ON DELETE CASCADE
           );`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Transceiver;`);
        
    }

}
