import {IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString,  ValidateNested} from 'class-validator';
import { Type } from 'class-transformer';

class CreateAwardDto {
  @IsNotEmpty()
  @IsString()
  institution!: string;

  @IsNotEmpty()
  @IsInt()
  year!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  link?: string;
}

class CreateIndicatorDto {
  @IsNotEmpty()
  @IsString()
  label!: string;

  @IsNotEmpty()
  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  measure?: string;

  @IsNotEmpty()
  @IsString()
  source!: string;

  @IsNotEmpty()
  @IsInt()
  year!: number;
}

export class CreateProjectsDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsInt()
  team!: number;

  @IsNotEmpty()
  @IsInt()
  user!: number;

  @IsNotEmpty()
  @IsInt()
  family!: number;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsString()
  full_description?: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  source!: string[];

  @IsNotEmpty()
  @IsString()
  main_department!: string;

  @IsArray()
  @IsString({ each: true })
  related_departments!: string[];

  @IsArray()
  @IsString({ each: true })
  areas!: string[];

  @IsArray()
  @IsInt({ each: true })
  ods!: number[];

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsArray()
  @IsString({ each: true })
  technologies!: string[];

  @IsOptional()
  @IsDateString()
  implementation_date?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAwardDto)
  awards?: CreateAwardDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIndicatorDto)
  indicators?: CreateIndicatorDto[];

  @IsArray()
  @IsString({ each: true })
  keywords!: string[];
}