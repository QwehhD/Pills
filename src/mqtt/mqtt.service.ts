import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { connect, type MqttClient } from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client?: MqttClient;

  constructor(private readonly config: ConfigService) {}

  get connected(): boolean {
    return this.client?.connected ?? false;
  }

  topic(...parts: string[]): string {
    return [this.config.get('MQTT_TOPIC_PREFIX', 'pills'), ...parts].join('/');
  }

  onModuleInit() {
    if (this.config.get('MQTT_ENABLED') !== 'true') {
      this.logger.log('MQTT nonaktif (MQTT_ENABLED bukan "true")');
      return;
    }

    this.client = connect(this.config.getOrThrow<string>('MQTT_URL'), {
      username: this.config.get<string>('MQTT_USERNAME') || undefined,
      password: this.config.get<string>('MQTT_PASSWORD') || undefined,
      clientId: `pills-backend-${randomUUID()}`,
      reconnectPeriod: 5000,
    });

    this.client.on('connect', () => this.logger.log('Terhubung ke broker MQTT'));
    this.client.on('offline', () =>
      this.logger.warn('Terputus dari broker MQTT, mencoba lagi...'),
    );
    this.client.on('error', (err) =>
      this.logger.error(`MQTT error: ${err.message}`),
    );
  }

  async publish(topic: string, payload: object): Promise<void> {
    if (!this.client) return;
    await this.client.publishAsync(topic, JSON.stringify(payload), { qos: 1 });
  }

  async onModuleDestroy() {
    await this.client?.endAsync();
  }
}