import { Message, ConsumerGroup } from "kafka-node";
import { Observable, from, of } from "rxjs";
import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../repositories/account.ext";
import { IAccount, IDevice, IPartitionConfig, IUser, ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { AccountEntity } from "../entities/account.entity";
import { map, mergeMap } from "rxjs/operators";
import { DeviceEntity } from "../entities/device.entity";
import { PartitionConfigEntity } from "../entities/partitionconfig.entity";
import { UserEntity } from "../entities/user.entity";
import { UserExt } from "../repositories/user.ext";
import { DeviceExt } from "../repositories/device.ext";
import { KafkaService } from "../../kafka/services/kafka.service";
import { MailService } from "./mail-service";
import { TransceiverEntity } from "../entities/transceiver.entity";
import { ProviderExt } from "../repositories/provider.ext";
import { TransceiverExt } from "../repositories/transceiver.ext";
import { PartitionConfigExt } from "../repositories/partitionConfig.ext";

export class LoggerService {
    public classStore = [
        DeviceExt,
        AccountExt,
        UserExt,
        TransceiverExt,
        PartitionConfigExt
    ];

    public dynamicType(entityName: string): any {
        const className = `Ext${entityName}`;
        if (this.classStore[className] === undefined || this.classStore[className] === null) {
            throw new Error(`Class type of \'${entityName}\' is not in the store`);
        }

        return this.classStore[className];
    }

    public logSynchronize(message: string): void {
        const t = 2;
    }

}
