import { Module, forwardRef } from '@nestjs/common';
import { ModuleController } from './controllers/module.controller';
import { ModuleService } from './services/module.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransceiverExt } from './repositories/transceiver.ext';
import { DeviceExt } from './repositories/device.ext';
import { AuthModule } from '../authentication';
import { ManagerService } from './services/manager.service';
import { KafkaModule } from '../kafka/kafka.module';
import { ModuleExt } from './repositories/module.ext';
import { SchemeExt } from './repositories/scheme.ext';
import { SectorExt } from './repositories/sector.ext';
import { DeviceController } from './controllers/device.controller';
import { DeviceService } from './services/device.service';
import { GroupViewController } from './controllers/groupView.controller';
import { GroupViewService } from './services/groupView.service';
import { GroupViewExt } from './repositories/groupView.ext';
import { SchemeController } from './controllers/scheme.controller';
import { SchemeService } from './services/scheme.service';
import { SectorController } from './controllers/sector.controller';
import { SectorService } from './services/sector.service';
import { TransceiverController } from './controllers/transceiver.controller';
import { TransceiverService } from './services/transceiver.service';
import { SynchronizerModule } from '../synchronizer/synchronizer.module';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleExt, TransceiverExt, DeviceExt, SchemeExt, SectorExt, GroupViewExt, SchemeExt]), forwardRef(() => AuthModule), KafkaModule, forwardRef(() => SynchronizerModule)],
  controllers: [ModuleController, DeviceController, GroupViewController, SchemeController, SectorController, TransceiverController],
  providers: [ModuleService, ManagerService, DeviceService, GroupViewService, SchemeService, SectorService, TransceiverService],
  exports: [ModuleService, ManagerService, DeviceService, GroupViewService, SchemeService, SectorService, TransceiverService]
})
export class ManagerModule { }
