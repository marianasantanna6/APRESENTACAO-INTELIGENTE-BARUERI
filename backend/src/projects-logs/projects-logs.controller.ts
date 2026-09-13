import { Controller, Get } from '@nestjs/common';

import { ProjectsLogsService } from './projects-logs.service';

@Controller('projects-logs')
export class ProjectsLogsController {
  constructor(
    private readonly projectsLogsService: ProjectsLogsService,
  ) {}
  
  @Get()
  find() {
    return this.projectsLogsService.find();
  }
}