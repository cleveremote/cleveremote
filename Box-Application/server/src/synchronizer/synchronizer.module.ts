import { Module, forwardRef } from '@nestjs/common';
import { SynchronizerService } from './services/synchronizer.service';
import { KafkaService } from '../kafka/services/kafka.service';
import { KafkaModule } from '../kafka/kafka.module';
import { ManagerModule } from '../manager/manager.module';
import { XbeeModule } from '../xbee/xbee.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SynchronizationExt } from './repositories/synchronization.ext';

@Module({
  imports: [TypeOrmModule.forFeature([SynchronizationExt]), KafkaModule, forwardRef(() => ManagerModule)],
  providers: [SynchronizerService],
  exports: [SynchronizerService]
})
export class SynchronizerModule { }
