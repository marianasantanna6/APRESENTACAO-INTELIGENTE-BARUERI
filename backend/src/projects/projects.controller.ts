import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectsDto } from './dto/inputs-projects.dto';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) { }
  @Post()
  create(@Body() dto: CreateProjectsDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  find(
    @Query('id') id?: string,
    @Query('name') name?: string,
    @Query('user') user?: string,
    @Query('family') family?: string,
    @Query('main_department') main_department?: string,
    @Query('related_departments') related_departments?: string,
    @Query('areas') areas?: string,
    @Query('ods') ods?: string,
    @Query('awards') awards?: string,
    @Query('status') status?: string,
    @Query('implementation-date') implementation_date?: string,
  ) {
    return this.projectsService.find({
      id,
      name,
      user,
      family,
      main_department,
      related_departments,
      areas,
      ods,
      awards,
      status,
      implementation_date,
    });
  }
}