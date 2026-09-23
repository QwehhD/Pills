import { IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class CreateScheduleDto {
  @IsUUID()
  patient_id: string;

  @IsString()
  @MinLength(2)
  medicine_name: string;

  @IsString()
  @MinLength(1)
  dose: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'time must be in HH:mm format, for example 08:00',
  })
  time: string;
}