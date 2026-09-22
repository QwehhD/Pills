import { IsInt, IsString, IsUUID, Matches, Max, Min, MinLength } from 'class-validator';
import { RegisterDto } from './register.dto';

export class RegisterPatientDto extends RegisterDto {
  @IsUUID()
  doctor_id: string;

  @IsInt()
  @Min(0)
  @Max(150)
  age: number;

  @IsString()
  @MinLength(2)
  disease: string;

  @Matches(/^(\+62|62|0)8\d{7,11}$/, {
    message: 'phone must be a valid Indonesian mobile number',
  })
  phone: string;
}