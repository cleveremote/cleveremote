import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaModule } from './kafka/kafka.module';
import { typeOrmConfig } from './common/typeorm.config';
import { LaunchModule } from './launch/launch.module';
import { ManagerModule } from './manager/manager.module';
import { AuthModule } from './authentication';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), KafkaModule, ManagerModule, LaunchModule, AuthModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule { }
