import { Message, ConsumerGroup } from "kafka-node";
import { Observable, from, of } from "rxjs";
import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../entities/custom.repositories/account.ext";
import { IAccount, IDevice, IPartitionConfig, IUser, ISynchronize, ISynchronizeParams } from "../entities/interfaces/entities.interface";
import { Account } from "../entities/gen.entities/account";
import { map, mergeMap } from "rxjs/operators";
import { Device } from "../entities/gen.entities/device";
import { PartitionConfig } from "../entities/gen.entities/partition_config";
import { User } from "../entities/gen.entities/users";
import { UserExt } from "../entities/custom.repositories/user.ext";
import { DeviceExt } from "../entities/custom.repositories/device.ext";
import { KafkaService } from "./kafka.service";
import { MailService } from "./mail-service";
import { TransceiverConfigExt } from "../entities/custom.repositories/transceiverConfig.ext";
import { Transceiver } from "../entities/gen.entities/transceiver";
import { ProviderExt } from "../entities/custom.repositories/provider.ext";
import { TransceiverExt } from "../entities/custom.repositories/transceiver.ext";
import { PartitionConfigExt } from "../entities/custom.repositories/partitionConfig.ext";

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
