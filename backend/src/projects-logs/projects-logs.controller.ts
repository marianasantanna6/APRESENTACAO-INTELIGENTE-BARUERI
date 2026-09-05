import { Body, Controller, Post, Get } from '@nestjs/common';
import { ProjectsLogsService } from './projects-logs.service';
import { CreateProjectsLogsDto } from './dto/inputs-projects-logs.dto';

@Controller('projects-logs')
export class ProjectsLogsController {
  constructor(
    private readonly projectsLogsService: ProjectsLogsService,
  ) {}

  @Post()
  create(@Body() dto: CreateProjectsLogsDto) {
    return this.projectsLogsService.create(dto);
  }

  @Get()
  find() {
    return this.projectsLogsService.find();
  }
}