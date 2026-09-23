import { Injectable, Logger } from '@nestjs/common';
import { ScheduleStatus } from '@prisma/client';
import { currentWibTime } from '../common/waktu-wib';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HardwareService {
  private readonly logger = new Logger(HardwareService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkSchedule() {
    const time = currentWibTime();

    const schedule = await this.prisma.schedule.findFirst({
      where: { time, status: ScheduleStatus.PENDING },
      include: { patient: { select: { name: true } } },
      orderBy: { created_at: 'asc' },
    });

    if (!schedule) return { dispense: false };

    const claimed = await this.prisma.schedule.updateMany({
      where: { id: schedule.id, status: ScheduleStatus.PENDING },
      data: { status: ScheduleStatus.DISPENSED },
    });

    if (claimed.count === 0) return { dispense: false };

    this.logger.log(
      `${time} WIB: mengeluarkan ${schedule.medicine_name} (${schedule.dose}) untuk ${schedule.patient.name}`,
    );

    return {
      dispense: true,
      schedule_id: schedule.id,
      patient_name: schedule.patient.name,
      medicine_name: schedule.medicine_name,
      dose: schedule.dose,
    };
  }
}