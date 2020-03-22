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
import { SectorExt } from "../manager/repositories/sector.ext";
import { SchemeExt } from "../manager/repositories/scheme.ext";
import { ModuleExt } from "../manager/repositories/module.ext";

export class MapperService {
    public classStore = [
        AccountExt,
        UserExt,
        DeviceExt,
        PartitionConfigExt,
        ModuleExt,
        ProviderExt,
        SchemeExt,
        SectorExt,
        TransceiverExt
    ];

    public dynamicType(entityName: string): any {
        const className = `${entityName}Ext`;
        const t = this.classStore.find((test: any) => test.name === className);
        if (!t) {
            throw new Error(`Class type of \'${entityName}\' is not in the store`);
        }

        return t;
    }

    public dataBaseSynchronize(message: string): Observable<any> {
        const data: ISynchronizeParams = JSON.parse(message);
        const type = this.dynamicType(data.entity);
        const repository = getCustomRepository(type);
        return (repository as ISynchronize<typeof type>).synchronize(data);
    }

    public getDeviceId(entityName: string, data: string): Observable<any> {
        const type = this.dynamicType(entityName);
        const repository = getCustomRepository(type);
        return (repository as ISynchronize<typeof type>).getDeviceId(data);
    }

}
