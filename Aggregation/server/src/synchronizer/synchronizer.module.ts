import { Module, forwardRef } from '@nestjs/common';
import { SynchronizerService } from './services/synchronizer.service';
import { KafkaModule } from '../kafka/kafka.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SynchronizationExt } from './repositories/synchronization.ext';
import { ManagerModule } from '../manager/manager.module';

@Module({
  imports: [TypeOrmModule.forFeature([SynchronizationExt]), KafkaModule, forwardRef(() => ManagerModule)],
  providers: [SynchronizerService],
  exports: [SynchronizerService]
})
export class SynchronizerModule { }
