import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDepartmentsDto {
  @IsNotEmpty()
  @IsString()
  name!: string;
}