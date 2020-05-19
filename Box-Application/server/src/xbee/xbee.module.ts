import { Module, forwardRef } from '@nestjs/common';
import { XbeeService } from './services/xbee.service';
import { XbeeController } from './controllers/xbee.controller';
import { ManagerModule } from '../manager/manager.module';
import { KafkaModule } from '../kafka/kafka.module';
import { SynchronizerService } from '../synchronizer/services/synchronizer.service';
import { SynchronizerModule } from '../synchronizer/synchronizer.module';

@Module({
  imports: [ManagerModule, KafkaModule, forwardRef(() => SynchronizerModule)],
  providers: [XbeeService],
  controllers: [XbeeController],
  exports: [XbeeService]
})
export class XbeeModule { }
