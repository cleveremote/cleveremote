import { Module } from '@nestjs/common';
import { DispatchService } from './services/dispatch.service';
import { KafkaService } from '../kafka/services/kafka.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  providers: [DispatchService],
  exports: [DispatchService]
})
export class DispatchModule { }
