import { Message, ConsumerGroup, ConsumerGroupStream } from "kafka-node";
import { Observable, from, of } from "rxjs";
import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../entities/custom.repositories/account.ext";
import { IAccount, IDevice, IPartitionConfig, IUser } from "../entities/interfaces/entities.interface";
import { Account } from "../entities/gen.entities/account";
import { map, mergeMap } from "rxjs/operators";
import { Device } from "../entities/gen.entities/device";
import { PartitionConfig } from "../entities/gen.entities/partition_config";
import { User } from "../entities/gen.entities/users";
import { UserExt } from "../entities/custom.repositories/user.ext";
import { KafkaService } from "./kafka.service";
import { MapperService } from "./mapper.service";
import { LoggerService } from "./logger.service";
import { Tools } from "./tools-service";
import { genericRetryStrategy } from "./tools/generic-retry-strategy";

export class DispatchService {
    private mapperService: MapperService;
    private loggerService: LoggerService;

    constructor() {
        this.mapperService = new MapperService();
        this.loggerService = new LoggerService();
    }

    public init(): Observable<void> {

        KafkaService.instance.consumers.forEach(consumer => {
            consumer.on('data', (message: Message) => {
                this.routeMessage(consumer, message);
            });
            consumer.on('error', (err: any) => {
                Tools.logError('error', err);
            });
        });

        if (KafkaService.flagIsFirstConnection) {
            const payloads = [
                { topic: 'aggregator_init_connexion', messages: JSON.stringify({ serialNumber: Tools.serialNumber }), key: Tools.serialNumber }
            ];

            // KafkaService.instance.producer.send(payloads, (err, data) => {
            //     Tools.logError('error', err);
            // });
        }

        Tools.logSuccess('  => OK.');

        return of(undefined);

    }

    public routeMessage(consumer: ConsumerGroupStream, message: Message): void {
        consumer.commit(message, true, (error, data) => {
            if (!error) {
                console.log(
                    'consumer read msg %s Topic="%s" Partition=%s Offset=%d',
                    message.value, message.topic, message.partition, message.offset
                );

                switch (message.topic) {
                    case `${Tools.serialNumber}_init_connexion`:
                        // this.proccessSyncConnexion(String(message.value));
                        break;
                    case "box_action":
                        // this.mapperService.dataBaseSynchronize(String(message.value));
                        const dataExample = {
                            entity: 'Account', type: 'UPDATE',
                            data: { account_id: 'server_3', name: 'name12', description: 'description1234' }
                        };
                        const payloads = [
                            { topic: 'box_action_response', messages: JSON.stringify(message), key: 'server_1' }
                        ];

                        KafkaService.instance.sendMessage(payloads).pipe(mergeMap((data: any) =>
                            KafkaService.instance.checkReponseMessage(data)
                        )).subscribe(
                            () => { },
                            (e) => {
                                Tools.logError('error on send message => ' + JSON.stringify(e));
                            });
                        break;
                    case "box_dbsync":
                         this.loggerService.logSynchronize(String(message.value));
                        break;
                    default:
                        break;
                }

            } else {
                console.log(error);
            }

        });


    }

    public proccessSyncConnexion(value: string | Buffer): Observable<boolean> {
        const data = JSON.parse(String(value));
        const accountData: IAccount = data.account; // { account_id: 'server_3', name: 'name12', description: 'description' } as any;
        const accountToSave = new Account();
        accountToSave.account_id = accountData.account_id;
        accountToSave.name = accountData.name;
        accountToSave.description = accountData.description;

        const deviceData: IDevice = data.device;//{ device_id: 'server_3', name: 'name121', description: 'description' } as any;
        const deviceToSave = new Device();
        deviceToSave.account = accountToSave;
        deviceToSave.description = deviceData.description;
        deviceToSave.device_id = deviceData.device_id;
        deviceToSave.name = deviceData.name;

        const partitionData: IPartitionConfig = data.partitionConfig;//{ config_id: 'server_3', start_range: 2, end_range: 3 } as any;
        const partitionToSave = new PartitionConfig();
        partitionToSave.config_id = partitionData.config_id;
        partitionToSave.start_range = partitionData.start_range;
        partitionToSave.end_range = partitionData.end_range;

        deviceToSave.partition_configs = [partitionToSave];

        // {user_id: 'server_3',email: 'email1',password: '$2a$08$GvDZDoL..cHoc8n8HFUp6en6PiH5I2cqYvj4xDsbomC25WPc/6Iwa1',number_phone: '0682737505',last_name: 'last_name',first_name: 'first_name'} as any;
        const userData: IUser = data.user;
        const userToSave = new User();
        userToSave.user_id = userData.user_id;
        userToSave.email = userData.email;
        userToSave.number_phone = userData.number_phone;
        userToSave.first_name = userData.first_name;
        userToSave.last_name = userData.last_name;
        userToSave.password = userData.password;

        accountToSave.users = [userToSave];
        accountToSave.devices = [deviceToSave];

        return from(getRepository(Account).save(accountToSave)).pipe(
            mergeMap((accountSaved: Account) => of(true)));
    }

}
