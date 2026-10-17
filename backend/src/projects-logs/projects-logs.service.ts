import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ProjectsLogsFilters {
  user?: string;
  project?: string;
  action?: string;
}

@Injectable()
export class ProjectsLogsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  private parseId(value?: string): bigint | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException('ID de filtro inválido.');
    }

    return BigInt(value);
  }

  async find(
    actorId: string | number,
    filters: ProjectsLogsFilters = {},
  ) {
    const actor = this.parseId(String(actorId));

    if (actor === undefined) {
      throw new BadRequestException('ID de usuário inválido.');
    }

    const userFilter = this.parseId(filters.user);
    const projectFilter = this.parseId(filters.project);
    const actionFilter = filters.action?.trim();

    const currentUser = await this.prisma.users.findUnique({
      where: { id: actor },
      select: { head_manager: true },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const where: any = {};

    // Filtros opcionais.
    if (userFilter !== undefined) {
      where.user = userFilter;
    }

    if (projectFilter !== undefined) {
      where.project = projectFilter;
    }

    if (actionFilter) {
      where.action = {
        contains: actionFilter,
        mode: 'insensitive',
      };
    }

    // Head manager pode consultar todos os logs.
    if (currentUser.head_manager) {
      return this.getLogs(where);
    }

    const roles = await this.prisma.users_role.findMany({
      where: { user: actor },
      select: {
        sector: true,
        team: true,
        sector_manager: true,
        team_manager: true,
      },
    });

    const managedSectorIds = new Set<string>();
    const managedTeamIds = new Set<string>();

    for (const role of roles) {
      if (role.sector_manager) {
        managedSectorIds.add(role.sector.toString());
      }

      if (role.team_manager && role.team !== null) {
        managedTeamIds.add(role.team.toString());
      }
    }

    const isManager =
      managedSectorIds.size > 0 ||
      managedTeamIds.size > 0;

    // Usuário comum: somente os próprios logs.
    if (!isManager) {
      if (userFilter !== undefined && userFilter !== actor) {
        return [];
      }

      where.user = actor;
      return this.getLogs(where);
    }

    // Equipes vinculadas aos setores gerenciados.
    if (managedSectorIds.size > 0) {
      const sectorTeams = await this.prisma.teams.findMany({
        where: {
          sector: {
            in: [...managedSectorIds].map(BigInt),
          },
        },
        select: { id: true },
      });

      for (const team of sectorTeams) {
        managedTeamIds.add(team.id.toString());
      }
    }

    // Gestores só podem consultar projetos das equipes autorizadas.
    if (managedTeamIds.size === 0) {
      return [];
    }

    const authorizedTeamIds = [...managedTeamIds].map(BigInt);

    where.projects = {
      is: {
        team: {
          in: authorizedTeamIds,
        },
      },
    };

    return this.getLogs(where);
  }

  private async getLogs(where: any) {
    const logs = await this.prisma.projects_logs.findMany({
      where,
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