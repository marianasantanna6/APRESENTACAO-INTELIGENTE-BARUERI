import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProjectsLogsDto {
  @IsNotEmpty()
  @IsString()
  user!: string;

  @IsNotEmpty()
  @IsString()
  action!: string;

  @IsNotEmpty()
  @IsString()
  project!: string;
}