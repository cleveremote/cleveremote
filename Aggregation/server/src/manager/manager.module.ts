import { Module } from '@nestjs/common';
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
import { AssGroupViewModuleExt } from './repositories/assGroupViewModule.ext';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleExt, TransceiverExt, DeviceExt, SchemeExt, SectorExt, GroupViewExt, AssGroupViewModuleExt]), AuthModule, KafkaModule],
  controllers: [ModuleController, DeviceController, GroupViewController],
  providers: [ModuleService, ManagerService, DeviceService, GroupViewService],
  exports: [ModuleService, ManagerService, DeviceService, GroupViewService]
})
export class ManagerModule { }
