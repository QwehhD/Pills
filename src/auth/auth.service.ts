import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    await this.assertEmailAvailable(dto.email);

    const password = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password,
        role: Role.DOCTOR,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
  }

  getDoctors() {
    return this.prisma.user.findMany({
      where: { role: Role.DOCTOR },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async registerPatient(dto: RegisterPatientDto) {
    const doctor = await this.prisma.user.findUnique({
      where: { id: dto.doctor_id },
    });
    if (!doctor || doctor.role !== Role.DOCTOR) {
      throw new BadRequestException('Doctor not found');
    }

    await this.assertEmailAvailable(dto.email);

    const password = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password,
        role: Role.PATIENT,
        patientProfile: {
          create: {
            doctor_id: dto.doctor_id,
            age: dto.age,
            disease: dto.disease,
            phone: dto.phone,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        patientProfile: true,
      },
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const access_token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { access_token };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        patientProfile: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async assertEmailAvailable(email: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');
  }
}
