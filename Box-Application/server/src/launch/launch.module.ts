import { Module } from '@nestjs/common';
import { LaunchService } from './services/launch.service';
import { KafkaModule } from '../kafka/kafka.module';
import { XbeeModule } from '../xbee/xbee.module';
import { DispatchService } from '../dispatch/services/dispatch.service';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [XbeeModule, KafkaModule, DispatchModule],
  controllers: [],
  providers: [LaunchService],
  exports: [LaunchService]
})
export class LaunchModule { }
