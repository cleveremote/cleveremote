import { NestFactory } from '@nestjs/core';
import { from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import * as dotenv from "dotenv";
import { Server } from './server';
import { WebSocketService } from './services/websocket.service';
import { Tools } from './services/tools-service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import "reflect-metadata";

Tools.titleApplication();
dotenv.config({ path: ".env" });

import { AppModule } from './app.module';

async function bootstrap() {
  const adapter = new FastifyAdapter();
  adapter.register(require('fastify-multipart'));
  from(NestFactory.create<NestFastifyApplication>(AppModule, adapter))
    .pipe(mergeMap((app: any) => {

      const server: Server = new Server(app);
      return server.init();
    }))
    .pipe(mergeMap((app: any) => {
      return from(app.listen(process.env.PORT ? Number(process.env.PORT) || 3000 : 3000, process.env.NEST_HOST || '127.0.0.1'))
    }))
    .pipe(mergeMap((serverInstance: any) => {
        console.log(`* server OK on port ${process.env.PORT}`);
        Tools.titleStarted(true);
        serverInstance.timeout = Number(process.env.TIMEOUT_GLOBAL);
        const wss = new WebSocketService(serverInstance);
        return wss.init();
      })).subscribe();
}


bootstrap();
