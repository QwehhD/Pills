import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MqttService } from '../mqtt/mqtt.service';
import { HardwareService } from './hardware.service';

@Injectable()
export class DispenseScheduler {
  constructor(
    private readonly hardware: HardwareService,
    private readonly mqtt: MqttService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async pushDueSchedules() {
    if (!this.mqtt.connected) return;

    const due = await this.hardware.claimDueSchedules();

    for (const payload of due) {
      await this.mqtt.publish(
        this.mqtt.topic('patients', payload.patient_id, 'dispense'),
        payload,
      );
    }
  }
}