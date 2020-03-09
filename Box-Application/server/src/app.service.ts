import { Injectable } from '@nestjs/common';
import { XbeeService } from './xbee/services/xbee.service';

@Injectable()
export class AppService {
  getHello(): string {
    // const trans = new TransceiverService();
    // trans.initTransceivers().subscribe();

    return 'Hello World!';
  }
}
