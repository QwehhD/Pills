import { Module } from '@nestjs/common';
import { HardwareController } from './hardware.controller';
import { HardwareService } from './hardware.service';
import { MqttModule } from '../mqtt/mqtt.module';
import { DispenseScheduler } from './dispense.scheduler';

@Module({
  imports: [MqttModule],
  controllers: [HardwareController],
  providers: [HardwareService, DispenseScheduler],
})
export class HardwareModule {}