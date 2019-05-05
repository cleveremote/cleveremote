import {MigrationInterface, QueryRunner} from "typeorm";

export class createTransceiver1557085348819 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE Transceiver(
            transceiver_id VARCHAR (255) PRIMARY KEY,
            name VARCHAR (50) UNIQUE NOT NULL,
            description TEXT,
            address VARCHAR (255) NOT NULL,
            type VARCHAR (255) NOT NULL,
            config_id VARCHAR (255) NOT NULL, 
            FOREIGN KEY (config_id) REFERENCES Transceiver_config(config_id) ON DELETE CASCADE,
            coordinator_id VARCHAR (255) NOT NULL, 
            FOREIGN KEY (coordinator_id) REFERENCES Transceiver(transceiver_id) ON DELETE CASCADE,
            device_id VARCHAR (255) NOT NULL,
            FOREIGN KEY (device_id) REFERENCES Device(device_id) ON DELETE CASCADE
           );`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE Transceiver;`);
        
    }

}
