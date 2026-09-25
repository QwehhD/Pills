import { Injectable, Logger } from '@nestjs/common';
import { ScheduleStatus } from '@prisma/client';
import { currentWibTime } from '../common/waktu-wib';
import { PrismaService } from '../prisma/prisma.service';

export interface DispensePayload {
  schedule_id: string;
  patient_id: string;
  patient_name: string;
  medicine_name: string;
  dose: string;
}

@Injectable()
export class HardwareService {
  private readonly logger = new Logger(HardwareService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkSchedule() {
    const [payload] = await this.claimDueSchedules(1);
    return payload ? { dispense: true, ...payload } : { dispense: false };
  }

  async claimDueSchedules(limit?: number): Promise<DispensePayload[]> {
    const time = currentWibTime();

    const due = await this.prisma.schedule.findMany({
      where: { time, status: ScheduleStatus.PENDING },
      include: { patient: { select: { name: true } } },
      orderBy: { created_at: 'asc' },
      take: limit,
    });

    const claimed: DispensePayload[] = [];

    for (const schedule of due) {
      const { count } = await this.prisma.schedule.updateMany({
        where: { id: schedule.id, status: ScheduleStatus.PENDING },
        data: { status: ScheduleStatus.DISPENSED },
      });
      if (count === 0) continue;

      this.logger.log(
        `${time} WIB: mengeluarkan ${schedule.medicine_name} (${schedule.dose}) untuk ${schedule.patient.name}`,
      );

      claimed.push({
        schedule_id: schedule.id,
        patient_id: schedule.patient_id,
        patient_name: schedule.patient.name,
        medicine_name: schedule.medicine_name,
        dose: schedule.dose,
      });
    }

    return claimed;
  }
}