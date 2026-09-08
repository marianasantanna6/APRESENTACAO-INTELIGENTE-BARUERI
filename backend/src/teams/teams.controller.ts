import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamsDto } from './dto/inputs-teams.dto';

@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
  ) {}

  @Post()
  create(@Body() dto: CreateTeamsDto) {
    return this.teamsService.create(dto);
  }

  @Get()
  find(
    @Query('id') id?: string,
    @Query('name') name?: string,
  ) {
    return this.teamsService.find({ id, name });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}