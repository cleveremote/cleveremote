import { Module } from '@nestjs/common';
import { XbeeService } from '../services/xbee.service';
import { TransceiverService } from './services/transceiver.service';
import { XbeeController } from './controllers/xbee.controller';

@Module({
  imports: [],
  controllers: [XbeeController],
  providers: [TransceiverService],
  exports: [TransceiverService]
})
export class XbeeModule { }
