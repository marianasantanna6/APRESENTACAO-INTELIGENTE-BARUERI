import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateTeamsDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsInt()
  sector!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(3)
  level_acess!: number;
}