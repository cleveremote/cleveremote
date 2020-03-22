import { Message, ConsumerGroup } from "kafka-node";
import { Observable, from, of } from "rxjs";
import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../authentication/repositories/account.ext";
import { IAccount, IDevice, IPartitionConfig, IUser, ISynchronize, ISynchronizeParams } from "../manager/interfaces/entities.interface";
import { AccountEntity } from "../authentication/entities/account.entity";
import { map, mergeMap } from "rxjs/operators";
import { DeviceEntity } from "../manager/entities/device.entity";
import { PartitionConfigEntity } from "../manager/entities/partitionconfig.entity";
import { UserEntity } from "../authentication/entities/user.entity";
import { UserExt } from "../authentication/repositories/user.ext";
import { DeviceExt } from "../manager/repositories/device.ext";
import { KafkaService } from "../kafka/services/kafka.service";
import { MailService } from "./mail-service";
import { TransceiverEntity } from "../manager/entities/transceiver.entity";
import { ProviderExt } from "../authentication/repositories/provider.ext";
import { TransceiverExt } from "../manager/repositories/transceiver.ext";
import { PartitionConfigExt } from "../manager/repositories/partitionConfig.ext";

export class LoggerService {
    public classStore = [
        DeviceExt,
        AccountExt,
        UserExt,
        TransceiverExt,
        DeviceExt,
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
