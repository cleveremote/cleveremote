import { Module } from '@nestjs/common';
import { XbeeService } from '../services/xbee.service';
import { KafkaService } from './services/kafka.service';
import { KafkaController } from './controllers/kafka.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceExt } from '../entities/custom.repositories/device.ext';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceExt])],
  controllers: [KafkaController],
  providers: [KafkaService],
  exports: [KafkaService]
})
export class KafkaModule { }
