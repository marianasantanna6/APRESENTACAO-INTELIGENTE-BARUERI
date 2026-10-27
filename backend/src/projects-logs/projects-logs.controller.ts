import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ProjectsLogsService } from './projects-logs.service';
import { JwtAuthGuard } from '../users/authentication/jwt-auth.guard';

@Controller('projects-logs') //Rota pai
@UseGuards(JwtAuthGuard)
export class ProjectsLogsController {
  constructor(
    private readonly projectsLogsService: ProjectsLogsService,
  ) {}

  @Get()
  find(
    @Req() req: any,
    @Query('user') user?: string,
    @Query('project') project?: string,
    @Query('action') action?: string,
  ) {
    if (!req.user?.id) {
      throw new BadRequestException(
        'Não foi possível identificar o usuário autenticado.',
      );
    }

    return this.projectsLogsService.find(req.user.id, {
      user,
      project,
      action,
    });
  }
}
