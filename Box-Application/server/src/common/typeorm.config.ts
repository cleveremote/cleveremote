import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ModuleEntity } from '../manager/entities/module.entity';
import { GroupViewEntity } from '../manager/entities/groupView.entity';
import { AccountEntity } from '../authentication/entities/account.entity';
import { DeviceEntity } from '../manager/entities/device.entity';
import { PartitionConfigEntity } from '../manager/entities/partitionconfig.entity';
import { ProviderEntity } from '../authentication/entities/provider.entity';
import { SchemeEntity } from '../manager/entities/scheme.entity';
import { SectorEntity } from '../manager/entities/sector.entity';
import { SynchronizationEntity } from '../synchronizer/entities/synchronization.entity';
import { TransceiverEntity } from '../manager/entities/transceiver.entity';
import { UserEntity } from '../authentication/entities/user.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
    //type: (process.env.TYPEORM_CONNECTION) as any,
    type:'sqlite',
    //host: process.env.TYPEORM_HOST,
    //username: process.env.TYPEORM_USERNAME,
    //password: process.env.TYPEORM_PASSWORD,
    //database: process.env.TYPEORM_DATABASE,
    database: './boxTest.db',
    migrations: [process.env.TYPEORM_MIGRATIONS],
    entities: [
        AccountEntity,
        DeviceEntity,
        PartitionConfigEntity,
        ProviderEntity,
        SchemeEntity,
        SectorEntity,
        SynchronizationEntity,
        TransceiverEntity,
        UserEntity,
        ModuleEntity,
        GroupViewEntity],
    autoLoadEntities: true,
    // debug: true,
    // logging: true
};
