import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { XbeeModule } from './xbee/xbee.module';
import { KafkaModule } from './kafka/kafka.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { typeOrmConfig } from './common/typeorm.config';
import { LaunchModule } from './launch/launch.module';
import { ManagerModule } from './manager/manager.module';



@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), XbeeModule, KafkaModule, ManagerModule, LaunchModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule { }
