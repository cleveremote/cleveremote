import { Controller, Get, Query, Res, ValidationPipe } from '@nestjs/common';
import { TransceiverService } from '../services/transceiver.service';
import * as Fastify from 'fastify';
import * as http from 'http';
import { ScanDto } from '../dto/scan.dto';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Transceiver } from '../classes/transceiver.class';
import { AppError } from '../../errors/apperror.class';

@Controller('xbee')
export class XbeeController {
  constructor(private readonly transceiverService: TransceiverService) { }

  @Get('scan')
  //@Query(ValidationPipe)
  public scan(@Query() query: ScanDto, @Res() res: Fastify.FastifyReply<http.ServerResponse>): void {
   // const trans = new TransceiverService();
   this.transceiverService.initTransceivers().subscribe(
      (result: boolean) => {
        this.sendSuccess(res, result);
      }
    );
  }

  public sendSuccess(res: Fastify.FastifyReply<http.ServerResponse>, data?: any, code: number = AppError.HTTP_OK): void {
    res.status(code);
    res.send(data);
  }
}
