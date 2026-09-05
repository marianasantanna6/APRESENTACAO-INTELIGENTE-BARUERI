import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUsersSectorsDto {
  @IsNotEmpty()
  @IsInt()
  user!: number;

  @IsNotEmpty()
  @IsInt()
  sector!: number;

  @IsOptional()
  @IsBoolean()
  general_admin?: boolean;

  @IsOptional()
  @IsBoolean()
  institute_manager?: boolean;
}