import { Module } from '@nestjs/common';
import { ModuleController } from '../manager/controllers/module.controller';
import { ModuleService } from '../manager/services/module.service';
import { TransceiverService } from '../manager/services/transceiver.service';
import { TransceiverController } from '../manager/controllers/transceiver.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleExt } from '../manager/repositories/module.ext';
import { TransceiverExt } from '../manager/repositories/transceiver.ext';
import { XbeeService } from './services/xbee.service';

@Module({
  providers: [XbeeService],
  exports: [XbeeService]
})
export class XbeeModule { }
