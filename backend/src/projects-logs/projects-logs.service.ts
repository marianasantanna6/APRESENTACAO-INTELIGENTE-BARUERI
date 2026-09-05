import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectsLogsDto } from './dto/inputs-projects-logs.dto';

@Injectable()
export class ProjectsLogsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  async create(dto: CreateProjectsLogsDto) {
    const projectId = BigInt(dto.project);
    const userId = BigInt(dto.user);
    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException( 'Projeto não encontrado' );
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException( 'Usuário não encontrado' );
    }

    const log = await this.prisma.projects_logs.create({
      data: {
        user: userId,
        action: dto.action,
        project: projectId,
        moment: new Date(),
      },
    });
    return {
      id: log.id.toString(),
      user: log.user.toString(),
      action: log.action,
      project: log.project.toString(),
      moment: log.moment,
    };
  }

  async find() {
    const logs = await this.prisma.projects_logs.findMany({
      orderBy: { moment: 'desc' },
    });
    return logs.map((log) => ({
      id: log.id.toString(),
      user: log.user.toString(),
      action: log.action,
      project: log.project.toString(),
      moment: log.moment,
    }));
  }
}