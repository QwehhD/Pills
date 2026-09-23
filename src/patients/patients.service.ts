import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

const patientSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  created_at: true,
  patientProfile: true,
} as const;

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(doctorId: string) {
    return this.prisma.user.findMany({
      where: { role: Role.PATIENT, patientProfile: { doctor_id: doctorId } },
      select: patientSelect,
      orderBy: { created_at: 'desc' },
    });
  }

  findOne(id: string, doctorId: string) {
    return this.findOwned(id, doctorId);
  }

  async create(dto: CreatePatientDto, doctorId: string) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const password = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password,
        role: Role.PATIENT,
        patientProfile: {
          create: {
            doctor_id: doctorId,
            age: dto.age,
            disease: dto.disease,
            phone: dto.phone,
          },
        },
      },
      select: patientSelect,
    });
  }

  async update(id: string, dto: UpdatePatientDto, doctorId: string) {
    await this.findOwned(id, doctorId);

    const { name, ...profile } = dto;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        patientProfile: { update: profile },
      },
      select: patientSelect,
    });
  }

  async remove(id: string, doctorId: string) {
    await this.findOwned(id, doctorId);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Patient deleted successfully' };
  }

  private async findOwned(id: string, doctorId: string) {
    const patient = await this.prisma.user.findUnique({
      where: { id },
      select: patientSelect,
    });

    if (
      !patient ||
      patient.role !== Role.PATIENT ||
      patient.patientProfile?.doctor_id !== doctorId
    ) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }
}