import { Controller, Get, Query, Res, ValidationPipe } from '@nestjs/common';
import * as Fastify from 'fastify';
import * as http from 'http';
import { TestDto } from '../dto/test.dto';
// import { Transceiver } from '../classes/transceiver.class';
import { AppError } from '../../errors/apperror.class';
import { DispatchService } from '../services/dispatch.service';

@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) { }

  @Get('function-test')
  //@Query(ValidationPipe)
  public testget(@Query() query: TestDto, @Res() res: Fastify.FastifyReply<http.ServerResponse>): void {
    this.sendSuccess(res, { result: true });
  }

  public sendSuccess(res: Fastify.FastifyReply<http.ServerResponse>, data?: any, code: number = AppError.HTTP_OK): void {
    res.status(code);
    res.send(data);
  }
}
