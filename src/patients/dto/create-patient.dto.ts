import { OmitType } from '@nestjs/mapped-types';
import { RegisterPatientDto } from '../../auth/dto/register-patient.dto';

export class CreatePatientDto extends OmitType(RegisterPatientDto, [
    'doctor_id',
] as const) {}