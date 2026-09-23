import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { HardwareService } from './hardware.service';

@UseGuards(ApiKeyGuard)
@Controller('hardware')
export class HardwareController {
  constructor(private readonly hardwareService: HardwareService) {}

  @Get('check-schedule')
  checkSchedule() {
    return this.hardwareService.checkSchedule();
  }
}