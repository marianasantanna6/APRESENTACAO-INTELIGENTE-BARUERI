import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UsersRoleService } from './users-role.service';
import { CreateUsersRoleDto } from './dto/inputs-create-users-role.dto';
import { UpdateUsersRoleDto } from './dto/inputs-update-users-role.dto';
import { JwtAuthGuard } from '../users/authentication/jwt-auth.guard';

@Controller('users-role')
export class UsersRoleController {
  constructor(
    private readonly usersRoleService: UsersRoleService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateUsersRoleDto,
    @Req() req: any,
  ) {
    return this.usersRoleService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUsersRoleDto,
    @Req() req: any,
  ) {
    return this.usersRoleService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.usersRoleService.remove(id, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  find(
    @Query('user') user?: string,
    @Query('sector') sector?: string,
    @Query('team') team?: string,
    @Query('sector_manager') sector_manager?: string,
    @Query('team_manager') team_manager?: string,
    @Query('team_approver') team_approver?: string,
  ) {
    return this.usersRoleService.find({
      user,
      sector,
      team,
      sector_manager,
      team_manager,
      team_approver,
    });
  }
}