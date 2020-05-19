import { Module } from '@nestjs/common';
import { LaunchService } from './services/launch.service';
import { KafkaModule } from '../kafka/kafka.module';
import { DispatchModule } from '../dispatch/dispatch.module';
import { ManagerModule } from '../manager/manager.module';
import { SynchronizerModule } from '../synchronizer/synchronizer.module';

@Module({
    imports: [KafkaModule, DispatchModule, ManagerModule, SynchronizerModule],
    providers: [LaunchService],
    exports: [LaunchService]
})
export class LaunchModule { }
