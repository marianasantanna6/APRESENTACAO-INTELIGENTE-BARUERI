import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UsersTeamsService } from './users-teams.service';
import { CreateUsersTeamsDto } from './dto/inputs-users-teams.dto';

@Controller('users-teams')
export class UsersTeamsController {
  constructor(
    private readonly usersTeamsService: UsersTeamsService,
  ) {}

  @Post()
  create(@Body() dto: CreateUsersTeamsDto) {
    return this.usersTeamsService.create(dto);
  }

  @Get()
  find(
    @Query('user') user?: string,
    @Query('team') team?: string,
    @Query('area_manager') area_manager?: string,
    @Query('area_editor') area_editor?: string,
    @Query('approver') approver?: string,
  ) {
    return this.usersTeamsService.find({
      user,
      team,
      area_manager,
      area_editor,
      approver,
    });
  }
}