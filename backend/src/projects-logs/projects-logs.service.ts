import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsLogsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async find() {
    const logs = await this.prisma.projects_logs.findMany({
      orderBy: { moment: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id.toString(),
      user: log.user?.toString() ?? null,
      action: log.action,
      project: log.project.toString(),
      moment: log.moment,
    }));
  }
}