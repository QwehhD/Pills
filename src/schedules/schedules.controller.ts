import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SchedulesService } from './schedules.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Roles(Role.PATIENT)
  @Get('mine')
  findMine(@CurrentUser() patient: AuthUser) {
    return this.schedulesService.findMine(patient.id);
  }

  @Get()
  findAll(
    @CurrentUser() doctor: AuthUser,
    @Query('patient_id', new ParseUUIDPipe({ optional: true }))
    patientId?: string,
  ) {
    return this.schedulesService.findAll(doctor.id, patientId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() doctor: AuthUser,
  ) {
    return this.schedulesService.findOne(id, doctor.id);
  }

  @Post()
  create(@Body() dto: CreateScheduleDto, @CurrentUser() doctor: AuthUser) {
    return this.schedulesService.create(dto, doctor.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleDto,
    @CurrentUser() doctor: AuthUser,
  ) {
    return this.schedulesService.update(id, dto, doctor.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() doctor: AuthUser,
  ) {
    return this.schedulesService.remove(id, doctor.id);
  }
}