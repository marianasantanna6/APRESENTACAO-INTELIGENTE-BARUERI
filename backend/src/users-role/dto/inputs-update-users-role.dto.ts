import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUsersRoleDto {
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