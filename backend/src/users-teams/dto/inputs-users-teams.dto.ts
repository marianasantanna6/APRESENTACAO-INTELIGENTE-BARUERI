import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUsersTeamsDto {
  @IsNotEmpty()
  @IsInt()
  user!: number;

  @IsNotEmpty()
  @IsInt()
  team!: number;

  @IsOptional()
  @IsBoolean()
  area_manager?: boolean;

  @IsOptional()
  @IsBoolean()
  approver?: boolean;
}