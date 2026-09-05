import { IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectsDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsInt()
  user!: number;

  @IsOptional()
  @IsInt()
  family?: number;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsString()
  full_description?: string;

  @IsNotEmpty()
  @IsString()
  source!: string;

  @IsNotEmpty()
  @IsInt()
  main_department!: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  related_departments?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  areas?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  ods?: number[];

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsString()
  technologies?: string;

  @IsOptional()
  @IsDateString()
  implementation_date?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  awards?: string[];
}