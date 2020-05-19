import { Module, forwardRef } from '@nestjs/common';
import { ModuleController } from './controllers/module.controller';
import { ModuleService } from './services/module.service';
import { TransceiverService } from './services/transceiver.service';
import { TransceiverController } from './controllers/transceiver.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleExt } from './repositories/module.ext';
import { TransceiverExt } from './repositories/transceiver.ext';
import { ManagerService } from './services/manager.service';
import { DeviceExt } from './repositories/device.ext';
import { SchemeController } from './controllers/scheme.controller';
import { SchemeService } from './services/scheme.service';
import { SectorService } from './services/sector.service';
import { SectorController } from './controllers/sector.controller';
import { SchemeExt } from './repositories/scheme.ext';
import { SectorExt } from './repositories/sector.ext';
import { XbeeModule } from '../xbee/xbee.module';
import { KafkaModule } from '../kafka/kafka.module';
import { SynchronizerModule } from '../synchronizer/synchronizer.module';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleExt, TransceiverExt, DeviceExt, SchemeExt, SectorExt]), KafkaModule, forwardRef(() => SynchronizerModule), forwardRef(() => XbeeModule)],
  controllers: [ModuleController, TransceiverController, SchemeController, SectorController],
  providers: [ModuleService, TransceiverService, ManagerService, SchemeService, SectorService],
  exports: [ModuleService, TransceiverService, ManagerService, SchemeService, SectorService]
})
export class ManagerModule { }
