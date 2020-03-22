import { Module } from '@nestjs/common';
import { LaunchService } from './services/launch.service';
import { KafkaModule } from '../kafka/kafka.module';
import { DispatchModule } from '../dispatch/dispatch.module';
import { ManagerModule } from '../manager/manager.module';

@Module({
    imports: [KafkaModule, DispatchModule, ManagerModule],
    providers: [LaunchService],
    exports: [LaunchService]
})
export class LaunchModule { }
