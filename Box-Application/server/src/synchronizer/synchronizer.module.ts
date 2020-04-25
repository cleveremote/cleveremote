import { Module } from '@nestjs/common';
import { DispatchController } from './controllers/dispatch.controller';
import { SynchronizerService } from './services/synchronizer.service';
import { KafkaService } from '../kafka/services/kafka.service';
import { KafkaModule } from '../kafka/kafka.module';
import { ManagerModule } from '../manager/manager.module';
import { XbeeModule } from '../xbee/xbee.module';

@Module({
  imports: [KafkaModule],
  providers: [SynchronizerService],
  exports: [SynchronizerService]
})
export class SynchronizerModule { }
