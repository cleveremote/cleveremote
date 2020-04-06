import { MigrationInterface, QueryRunner } from "typeorm";

export class initData1656390280279 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `INSERT INTO "Account"("accountId", "name", "description") VALUES ('server_1', 'compte boitier ferme', 'le compte correspondant au boitier de la ferme');
             INSERT INTO "Device"("deviceId", "name", "description","accountId") VALUES ('server_1', 'Ferme', 'Boitier cleveremote ferme', 'server_1'); 
             INSERT INTO "PartitionConfig"("configId", "startRange", "endRange","deviceId") VALUES ('server_1', 0, 1,'server_1'); 
             INSERT INTO "User"("userId", "firstName", "lastName", "email", "phone", "password", "accountId") VALUES ('server_1', 'nadime', 'yahyaoui', 'nadime.yahyaoui@gmail.com', '0682737504', '$2a$08$GvDZDoL..cHoc8n8HFUp6en6PiH5I2cqYvj4xDsbomC25WPc/6Iwa', 'server_1');
             INSERT INTO "Scheme"("id", "file", "name", "description", "deviceId") VALUES ('server_1', 'file_name', 'name_name', 'desciption_value', 'server_1');
             INSERT INTO "GroupView"("groupId", "name", "description","deviceId") VALUES ('server_1', 'name_name','description','server_1');
             INSERT INTO "Sector"("sectorId", "name", "schemeId","groupId") VALUES ('server_1', 'name_name','server_1','server_1');`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        
    }

}
