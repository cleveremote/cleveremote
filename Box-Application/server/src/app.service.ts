import { Injectable } from '@nestjs/common';
import { TransceiverService } from './xbee/services/transceiver.service';

@Injectable()
export class AppService {
  getHello(): string {
    // const trans = new TransceiverService();
    // trans.initTransceivers().subscribe();

    return 'Hello World!';
  }
}
