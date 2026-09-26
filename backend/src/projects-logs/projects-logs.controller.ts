import { Controller, Get, UseGuards } from '@nestjs/common';

import { ProjectsLogsService } from './projects-logs.service';
import { JwtAuthGuard } from '../users/authentication/jwt-auth.guard';

@Controller('projects-logs')
export class ProjectsLogsController {
  constructor(
    private readonly projectsLogsService: ProjectsLogsService,
  ) {}
  
  @Get()
  @UseGuards(JwtAuthGuard)
  find() {
    return this.projectsLogsService.find();
  }
}