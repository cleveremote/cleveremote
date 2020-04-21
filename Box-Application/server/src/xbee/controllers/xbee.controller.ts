import { Controller, Get } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { XbeeService } from '../services/xbee.service';

@Controller('xbee')
export class XbeeController {
    constructor(private readonly xbeeService: XbeeService) { }

    @Get('scan')
    public getScan(): Observable<any> {
        return this.xbeeService.getNetworkGraph();
    }
}
