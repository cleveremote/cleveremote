import { MigrationInterface, QueryRunner } from "typeorm";

export class initData1556390280279 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `INSERT INTO public.account(accountId, name, description) VALUES ('server_1', 'compte boitier ferme', 'le compte correspondant au boitier de la ferme');
             INSERT INTO public.device(deviceId, name, description,accountId) VALUES ('server_1', 'Ferme', 'Boitier cleveremote ferme', 'server_1'); 
             INSERT INTO public.partition_config(configId, startRange, endRange,deviceId) VALUES ('server_1', 0, 1,'server_1'); 
             INSERT INTO public.users(userId, firstName, lastName, email, phone, password, accountId) VALUES ('server_1', 'nadime', 'yahyaoui', 'nadime.yahyaoui@gmail.com', '0682737504', '$2a$08$GvDZDoL..cHoc8n8HFUp6en6PiH5I2cqYvj4xDsbomC25WPc/6Iwa', 'server_1');`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        
    }

}
