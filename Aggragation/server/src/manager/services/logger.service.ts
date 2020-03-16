import { Message, ConsumerGroup } from "kafka-node";
import { Observable, from, of } from "rxjs";
import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../repositories/account.ext";
import { IAccount, IDevice, IPartitionConfig, IUser, ISynchronize, ISynchronizeParams } from "../interfaces/entities.interface";
import { Account } from "../entities/account";
import { map, mergeMap } from "rxjs/operators";
import { Device } from "../entities/device";
import { PartitionConfig } from "../entities/partition_config";
import { User } from "../entities/users";
import { UserExt } from "../repositories/user.ext";
import { DeviceExt } from "../repositories/device.ext";
import { KafkaService } from "../../kafka/services/kafka.service";
import { MailService } from "./mail-service";
import { TransceiverConfigExt } from "../repositories/transceiverConfig.ext";
import { Transceiver } from "../entities/transceiver";
import { ProviderExt } from "../repositories/provider.ext";
import { TransceiverExt } from "../repositories/transceiver.ext";
import { PartitionConfigExt } from "../repositories/partitionConfig.ext";

export class LoggerService {
    public classStore = [
        DeviceExt,
        AccountExt,
        UserExt,
        TransceiverConfigExt,
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
