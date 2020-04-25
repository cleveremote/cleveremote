import { Controller, Get, Query, Res, ValidationPipe } from '@nestjs/common';
import { DispatchService } from '../services/synchronizer.service';

@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) { }

}
