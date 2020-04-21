import { Module } from '@nestjs/common';
import { XbeeService } from './services/xbee.service';
import { XbeeController } from './controllers/xbee.controller';
import { ManagerModule } from '../manager/manager.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [ManagerModule, KafkaModule],
  providers: [XbeeService],
  controllers: [XbeeController],
  exports: [XbeeService]
})
export class XbeeModule { }
