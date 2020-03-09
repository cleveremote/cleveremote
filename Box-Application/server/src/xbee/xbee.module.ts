import { Module } from '@nestjs/common';
import { XbeeService } from '../services/xbee.service';
import { XbeeController } from './controllers/xbee.controller';
import { ModuleController } from './controllers/module.controller';
import { ModuleService } from './services/module.service';
import { TransceiverService } from './services/transceiver.service';
import { TransceiverController } from './controllers/transceiver.controller';

@Module({
  imports: [],
  controllers: [XbeeController, ModuleController, TransceiverController],
  providers: [XbeeService, ModuleService, TransceiverService],
  exports: [XbeeService, ModuleService, TransceiverService]
})
export class XbeeModule { }
