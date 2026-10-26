import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUsersRoleDto {
  @IsNotEmpty()
  @IsInt()
  user!: number;

  @IsNotEmpty()
  @IsInt()
  sector!: number;

  @IsOptional()
  @IsInt()
  team?: number;

  @IsOptional()
  @IsBoolean()
  sector_manager?: boolean;

  @IsOptional()
  @IsBoolean()
  team_manager?: boolean;

  @IsOptional()
  @IsBoolean()
  team_approver?: boolean;
}