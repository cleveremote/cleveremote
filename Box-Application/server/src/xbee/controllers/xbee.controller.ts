import { Controller, Get, Query, Res, ValidationPipe } from '@nestjs/common';
import { XbeeService } from '../services/xbee.service';
import * as http from 'http';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Transceiver } from '../classes/transceiver.class';
import { AppError } from '../../errors/apperror.class';
import { Observable } from 'rxjs';

@Controller('xbee')
export class XbeeController {
  constructor(private readonly transceiverService: XbeeService) { }

  @Get('scan')
  public scan(): Observable<any> {
   return this.transceiverService.initTransceivers();
  }

}
