import { Controller, Get, Query, Res, ValidationPipe } from '@nestjs/common';
import * as Fastify from 'fastify';
import * as http from 'http';
import { MessageDto } from '../dto/message.dto';
// import { Transceiver } from '../classes/transceiver.class';
import { AppError } from '../../errors/apperror.class';
import { KafkaService } from '../services/kafka.service';

@Controller('kafka')
export class KafkaController {
  constructor(private readonly kafkaService: KafkaService) { }

  @Get('send')
  //@Query(ValidationPipe)
  public scan(@Query() query: MessageDto, @Res() res: Fastify.FastifyReply<http.ServerResponse>): void {
   // const trans = new TransceiverService();
  //  this.transceiverService.initTransceivers().subscribe(
  //     (result: boolean) => {
  //       this.sendSuccess(res, result);
  //     }
  //   );
  }

  public sendSuccess(res: Fastify.FastifyReply<http.ServerResponse>, data?: any, code: number = AppError.HTTP_OK): void {
    res.status(code);
    res.send(data);
  }
}
