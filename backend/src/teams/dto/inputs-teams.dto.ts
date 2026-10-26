import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateTeamsDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsInt()
  sector!: number;
}