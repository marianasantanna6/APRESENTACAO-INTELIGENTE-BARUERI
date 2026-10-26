import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamsDto } from './dto/inputs-teams.dto';
import { JwtAuthGuard } from '../users/authentication/jwt-auth.guard';

@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateTeamsDto,
    @Req() req: any,
  ) {
    return this.teamsService.create(dto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  find(
    @Query('id') id?: string,
    @Query('name') name?: string,
  ) {
    return this.teamsService.find({ id, name });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}