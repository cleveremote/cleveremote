import { Module } from '@nestjs/common';
import { DispatchController } from './controllers/dispatch.controller';
import { DispatchService } from './services/dispatch.service';
import { KafkaService } from '../kafka/services/kafka.service';
import { KafkaModule } from '../kafka/kafka.module';
import { ManagerModule } from '../manager/manager.module';
import { XbeeModule } from '../xbee/xbee.module';

@Module({
  imports: [KafkaModule,ManagerModule,XbeeModule],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService]
})
export class DispatchModule { }
