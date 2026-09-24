import { OmitType } from '@nestjs/swagger';
import { RegisterPatientDto } from '../../auth/dto/register-patient.dto';

export class CreatePatientDto extends OmitType(RegisterPatientDto, [
  'doctor_id',
] as const) {}