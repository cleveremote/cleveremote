import { Module } from '@nestjs/common';
import { XbeeController } from './controllers/xbee.controller';
import { ModuleController } from './controllers/module.controller';
import { ModuleService } from './services/module.service';
import { TransceiverService } from './services/transceiver.service';
import { TransceiverController } from './controllers/transceiver.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleExt } from './repositories/module.ext';
import { TransceiverExt } from './repositories/transceiver.ext';
import { XbeeService } from './services/xbee.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleExt, TransceiverExt])],
  controllers: [XbeeController, ModuleController, TransceiverController],
  providers: [XbeeService, ModuleService, TransceiverService],
  exports: [XbeeService, ModuleService, TransceiverService]
})
export class XbeeModule { }
