import { Message, ConsumerGroup } from "kafka-node";
import { Observable, from, of } from "rxjs";
import { getCustomRepository, getRepository } from "typeorm";
import { AccountExt } from "../entities/custom.repositories/account.ext";
import { IAccount, IDevice, IPartitionConfig, IUser, ISynchronize, ISynchronizeParams } from "../entities/interfaces/entities.interface";
import { AccountEntity } from "../entities/gen.entities/account.entity";
import { map, mergeMap } from "rxjs/operators";
import { DeviceEntity } from "../kafka/entities/device.entity";
import { PartitionConfigEntity } from "../kafka/entities/partitionconfig.entity";
import { UserEntity } from "../entities/gen.entities/user.entity";
import { UserExt } from "../entities/custom.repositories/user.ext";
import { DeviceExt } from "../entities/custom.repositories/device.ext";
import { KafkaService } from "../kafka/services/kafka.service";
import { MailService } from "./mail-service";
import { TransceiverEntity } from "../xbee/entities/transceiver.entity";
import { ProviderExt } from "../entities/custom.repositories/provider.ext";
import { TransceiverExt } from "../xbee/repositories/transceiver.ext";
import { PartitionConfigExt } from "../entities/custom.repositories/partitionConfig.ext";

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
