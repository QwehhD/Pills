import { Injectable, NotFoundException } from '@nestjs/common';
import { PatientsService } from '../patients/patients.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

const scheduleInclude = {
  patient: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patients: PatientsService,
  ) {}

  findAll(doctorId: string, patientId?: string) {
    return this.prisma.schedule.findMany({
      where: {
        doctor_id: doctorId,
        ...(patientId && { patient_id: patientId }),
      },
      include: scheduleInclude,
      orderBy: [{ time: 'asc' }, { created_at: 'desc' }],
    });
  }

  findMine(patientId: string) {
    return this.prisma.schedule.findMany({
      where: { patient_id: patientId },
      orderBy: { time: 'asc' },
    });
  }

  findOne(id: string, doctorId: string) {
    return this.findOwned(id, doctorId);
  }

  async create(dto: CreateScheduleDto, doctorId: string) {
    await this.patients.findOne(dto.patient_id, doctorId);

    return this.prisma.schedule.create({
      data: {
        doctor_id: doctorId,
        patient_id: dto.patient_id,
        medicine_name: dto.medicine_name,
        dose: dto.dose,
        time: dto.time,
      },
      include: scheduleInclude,
    });
  }

  async update(id: string, dto: UpdateScheduleDto, doctorId: string) {
    await this.findOwned(id, doctorId);

    return this.prisma.schedule.update({
      where: { id },
      data: dto,
      include: scheduleInclude,
    });
  }

  async remove(id: string, doctorId: string) {
    await this.findOwned(id, doctorId);
    await this.prisma.schedule.delete({ where: { id } });
    return { message: 'Schedule deleted successfully' };
  }

  private async findOwned(id: string, doctorId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: scheduleInclude,
    });

    if (!schedule || schedule.doctor_id !== doctorId) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }
}