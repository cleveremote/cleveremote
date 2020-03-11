import { Message, ConsumerGroup, ConsumerGroupStream } from "kafka-node";
import { Observable, from, of } from "rxjs";
import { IAccount, IDevice, IPartitionConfig, IUser } from "../../entities/interfaces/entities.interface";
import { AccountEntity } from "../../entities/gen.entities/account.entity";
import { mergeMap } from "rxjs/operators";
import { PartitionConfigEntity } from "../../kafka/entities/partitionconfig.entity";
import { UserEntity } from "../../entities/gen.entities/user.entity";
import { KafkaService } from "../../kafka/services/kafka.service";
import { MapperService } from "../../services/mapper.service";
import { LoggerService } from "../../services/logger.service";
import { Tools } from "../../services/tools-service";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { getRepository } from "typeorm";
import { multibar } from "../../common/progress.bar";
import { DeviceEntity } from "../../kafka/entities/device.entity";
const _colors = require('colors');
let readline = require('readline');

@Injectable()
export class DispatchService {
    public progressBar;
    private mapperService: MapperService;
    private loggerService: LoggerService;

    constructor(@Inject(forwardRef(() => KafkaService)) private kafkaService: KafkaService) {
        this.mapperService = new MapperService();
        this.loggerService = new LoggerService();
    }

    public init(): Observable<void> {
        Tools.loginfoProgress('* Start micro-service : Dispatch...');

        this.progressBar = multibar.create(1, 0);
        let cloneOption = {} as any;
        cloneOption = Object.assign(cloneOption, multibar.options);
        cloneOption.format = _colors.green('Dispatch progress  ')+'|' + _colors.green('{bar}') + '| {percentage}% \n';
        this.progressBar.options = cloneOption;

        this.kafkaService.consumers.forEach(consumer => {
            consumer.on('data', (message: Message) => {
                this.routeMessage(consumer, message);
            });
            consumer.on('error', (err: any) => {
                Tools.logError('error', err);
            });
        });

        if (this.kafkaService.flagIsFirstConnection) {
            const payloads = [
                { topic: 'aggregator_init_connexion', messages: JSON.stringify({ serialNumber: Tools.serialNumber }), key: Tools.serialNumber }
            ];

            // KafkaService.instance.producer.send(payloads, (err, data) => {
            //     Tools.logError('error', err);
            // });
        }
        this.progressBar.increment();
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

                        this.kafkaService.sendMessage(payloads, true).subscribe(
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
        const accountToSave = new AccountEntity();
        accountToSave.accountId = accountData.accountId;
        accountToSave.name = accountData.name;
        accountToSave.description = accountData.description;

        const deviceData: IDevice = data.device;//{ device_id: 'server_3', name: 'name121', description: 'description' } as any;
        const deviceToSave = new DeviceEntity();
        deviceToSave.account = accountToSave;
        deviceToSave.description = deviceData.description;
        deviceToSave.deviceId = deviceData.deviceId;
        deviceToSave.name = deviceData.name;

        const partitionData: IPartitionConfig = data.partitionConfig;//{ config_id: 'server_3', start_range: 2, end_range: 3 } as any;
        const partitionToSave = new PartitionConfigEntity();
        partitionToSave.configId = partitionData.configId;
        partitionToSave.startRange = partitionData.startRange;
        partitionToSave.endRange = partitionData.endRange;

        deviceToSave.partitionConfigs = [partitionToSave];

        // {user_id: 'server_3',email: 'email1',password: '$2a$08$GvDZDoL..cHoc8n8HFUp6en6PiH5I2cqYvj4xDsbomC25WPc/6Iwa1',number_phone: '0682737505',last_name: 'last_name',first_name: 'first_name'} as any;
        const userData: IUser = data.user;
        const userToSave = new UserEntity();
        userToSave.userId = userData.userId;
        userToSave.email = userData.email;
        userToSave.phone = userData.phone;
        userToSave.firstName = userData.firstName;
        userToSave.lastName = userData.lastName;
        userToSave.password = userData.password;

        accountToSave.users = [userToSave];
        accountToSave.devices = [deviceToSave];

        return from(getRepository(AccountEntity).save(accountToSave)).pipe(
            mergeMap((accountSaved: AccountEntity) => of(true)));
    }

}