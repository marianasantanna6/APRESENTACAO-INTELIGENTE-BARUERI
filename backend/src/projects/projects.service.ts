
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeText } from '../common/normalizer';
import { CreateProjectsDto } from './dto/inputs-projects.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  private async getSourceName(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error();
      }

      const html = await response.text();

      const siteNameMatch = html.match(
        /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
      );

      if (siteNameMatch?.[1]) {
        return siteNameMatch[1].trim();
      }

      const titleMatch = html.match(
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      );

      if (titleMatch?.[1]) {
        return titleMatch[1].trim();
      }

      const htmlTitleMatch = html.match(
        /<title[^>]*>([^<]+)<\/title>/i,
      );

      if (htmlTitleMatch?.[1]) {
        return htmlTitleMatch[1].trim();
      }
    } catch { }

    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      return hostname;
    } catch {
      return url;
    }
  }

  private async mapSources(sources: string[]) {
    return Promise.all(
      sources.map(async (url) => ({
        url,
        name: await this.getSourceName(url),
      })),
    );
  }

  async create(dto: CreateProjectsDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const authenticatedUserId = BigInt(userId);
      const responsibleUserId = BigInt(dto.user);

      const user = await tx.users.findUnique({
        where: { id: authenticatedUserId },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const responsibleUser = await tx.users.findUnique({
        where: { id: responsibleUserId },
      });

      if (!responsibleUser) {
        throw new NotFoundException('Usuário responsável não encontrado');
      }

      if (responsibleUserId !== authenticatedUserId) {
        throw new ForbiddenException(
          'O usuário responsável deve ser o usuário autenticado',
        );
      }

      let family: bigint;
      let version: bigint;

      // NOVO PROJETO
      if (dto.family === 0) {
        const teamId = BigInt(dto.team);

        const team = await tx.teams.findUnique({
          where: { id: teamId },
        });

        if (!team) {
          throw new NotFoundException('Time não encontrado');
        }

        const userRole = await tx.users_role.findFirst({
          where: {
            user: authenticatedUserId,
            team: teamId,
          },
        });

        if (!userRole) {
          throw new ForbiddenException(
            'Usuário não está vinculado a este time',
          );
        }

        if (userRole.team_approver) {
          throw new ForbiddenException(
            'Usuário aprovador não pode criar projetos neste time',
          );
        }

        version = 1n;

        const moment = new Date();

        const project = await tx.projects.create({
          data: {
            name: dto.name,
            user: responsibleUserId,
            team: teamId,
            version,
            family: 0n,
            short_description: dto.short_description,
            full_description: dto.full_description,
            source: dto.source,
            main_department: dto.main_department,
            related_departments: dto.related_departments,
            areas: dto.areas,
            ods: dto.ods,
            theme: dto.theme,
            audience: dto.audience,
            technologies: dto.technologies,

            implementation_date:
              dto.implementation_date !== undefined
                ? new Date(dto.implementation_date)
                : null,

            keywords: dto.keywords,
            status: 1,
            last_update: moment,

            ...(dto.awards !== undefined
              ? {
                  awards: {
                    create: dto.awards.map((award) => ({
                      institution: award.institution,
                      year: award.year,
                      description: award.description,
                      link: award.link,
                    })),
                  },
                }
              : {}),

            ...(dto.indicators !== undefined
              ? {
                  indicators: {
                    create: dto.indicators.map((indicator) => ({
                      label: indicator.label,
                      value: indicator.value,
                      measure: indicator.measure,
                      source: indicator.source,
                      year: indicator.year,
                    })),
                  },
                }
              : {}),
          },
          include: {
            awards: true,
            indicators: true,
          },
        });

        // O próprio ID do projeto passa a identificar sua família.
        family = project.id;

        const updatedProject = await tx.projects.update({
          where: { id: project.id },
          data: { family },
          include: {
            awards: true,
            indicators: true,
          },
        });

        await tx.projects_logs.create({
          data: {
            user: authenticatedUserId,
            action: 'criou',
            project: updatedProject.id,
            moment,
          },
        });

        return {
          id: updatedProject.id.toString(),
          name: updatedProject.name,
          user: updatedProject.user.toString(),
          team: updatedProject.team.toString(),
          version: updatedProject.version.toString(),
          family: updatedProject.family.toString(),
          short_description: updatedProject.short_description,
          full_description: updatedProject.full_description,
          source: updatedProject.source,
          main_department: updatedProject.main_department,
          related_departments: updatedProject.related_departments,
          areas: updatedProject.areas,
          ods: updatedProject.ods,
          theme: updatedProject.theme,
          audience: updatedProject.audience,
          technologies: updatedProject.technologies,
          implementation_date: updatedProject.implementation_date,
          last_update: updatedProject.last_update,
          keywords: updatedProject.keywords,
          status: updatedProject.status,
          awards: updatedProject.awards,
          indicators: updatedProject.indicators,
        };
      }

      // NOVA VERSÃO
      family = BigInt(dto.family);

      const lastProject = await tx.projects.findFirst({
        where: { family },
        orderBy: { version: 'desc' },
      });

      if (!lastProject) {
        throw new NotFoundException('Projeto original não encontrado');
      }

      if (lastProject.status === 1) {
        throw new ForbiddenException(
          'Projetos em rascunho não podem ser atualizados',
        );
      }

      const userRole = await tx.users_role.findFirst({
        where: {
          user: authenticatedUserId,
          team: lastProject.team,
        },
      });

      if (!userRole) {
        throw new ForbiddenException(
          'Usuário não está vinculado ao time do projeto',
        );
      }

      if (userRole.team_approver) {
        throw new ForbiddenException(
          'Usuário aprovador não pode criar projetos neste time',
        );
      }

      version = lastProject.version + 1n;

      const moment = new Date();

      const newProject = await tx.projects.create({
        data: {
          name: dto.name,
          user: responsibleUserId,
          team: lastProject.team,
          version,
          family,
          short_description: dto.short_description,
          full_description: dto.full_description,
          source: dto.source,
          main_department: dto.main_department,
          related_departments: dto.related_departments,
          areas: dto.areas,
          ods: dto.ods,
          theme: dto.theme,
          audience: dto.audience,
          technologies: dto.technologies,

          implementation_date:
            dto.implementation_date !== undefined
              ? new Date(dto.implementation_date)
              : null,

          keywords: dto.keywords,
          status: 1,
          last_update: moment,

          ...(dto.awards !== undefined
            ? {
                awards: {
                  create: dto.awards.map((award) => ({
                    institution: award.institution,
                    year: award.year,
                    description: award.description,
                    link: award.link,
                  })),
                },
              }
            : {}),

          ...(dto.indicators !== undefined
            ? {
                indicators: {
                  create: dto.indicators.map((indicator) => ({
                    label: indicator.label,
                    value: indicator.value,
                    measure: indicator.measure,
                    source: indicator.source,
                    year: indicator.year,
                  })),
                },
              }
            : {}),
        },
        include: {
          awards: true,
          indicators: true,
        },
      });

      await tx.projects_logs.create({
        data: {
          user: authenticatedUserId,
          action: 'criou',
          project: newProject.id,
          moment,
        },
      });

      return {
        id: newProject.id.toString(),
        name: newProject.name,
        user: newProject.user.toString(),
        team: newProject.team.toString(),
        version: newProject.version.toString(),
        family: newProject.family.toString(),
        short_description: newProject.short_description,
        full_description: newProject.full_description,
        source: newProject.source,
        main_department: newProject.main_department,
        related_departments: newProject.related_departments,
        areas: newProject.areas,
        ods: newProject.ods,
        theme: newProject.theme,
        audience: newProject.audience,
        technologies: newProject.technologies,
        implementation_date: newProject.implementation_date,
        last_update: newProject.last_update,
        keywords: newProject.keywords,
        status: newProject.status,
        awards: newProject.awards,
        indicators: newProject.indicators,
      };
    });
  }

  async update(id: string, dto: CreateProjectsDto, userId: string) {
    const project = await this.prisma.projects.findUnique({
      where: { id: BigInt(id) },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (project.user !== BigInt(userId)) {
      throw new ForbiddenException('Usuário não pode editar este projeto');
    }

    const userRole = await this.prisma.users_role.findFirst({
      where: {
        user: BigInt(userId),
        team: project.team,
      },
    });

    if (!userRole) {
      throw new ForbiddenException(
        'Usuário não está vinculado a este time',
      );
    }

    if (userRole.team_approver) {
      throw new ForbiddenException(
        'Usuário aprovador não pode editar projetos neste time',
      );
    }

    if (project.status !== 1) {
      throw new ForbiddenException(
        'Apenas projetos em rascunho podem ser editados',
      );
    }

    if (BigInt(dto.user) !== BigInt(userId)) {
      throw new ForbiddenException(
        'O usuário responsável deve ser o usuário autenticado',
      );
    }

    const updatedProject = await this.prisma.$transaction(async (tx) => {
      const moment = new Date();

      const projectData: any = {
        name: dto.name,
        short_description: dto.short_description,
        full_description: dto.full_description,
        source: dto.source,
        main_department: dto.main_department,
        related_departments: dto.related_departments,
        areas: dto.areas,
        ods: dto.ods,
        theme: dto.theme,
        audience: dto.audience,
        technologies: dto.technologies,

        implementation_date:
          dto.implementation_date !== undefined
            ? new Date(dto.implementation_date)
            : null,

        keywords: dto.keywords,
        last_update: moment,
      };

      await tx.projects.update({
        where: { id: project.id },
        data: projectData,
      });

      if (dto.awards !== undefined) {
        await tx.awards.deleteMany({
          where: { project_award: project.id },
        });

        if (dto.awards.length > 0) {
          await tx.awards.createMany({
            data: dto.awards.map((award) => ({
              project_award: project.id,
              institution: award.institution,
              year: award.year,
              description: award.description,
              link: award.link,
            })),
          });
        }
      }

      if (dto.indicators !== undefined) {
        await tx.indicators.deleteMany({
          where: { project_indicator: project.id },
        });

        if (dto.indicators.length > 0) {
          await tx.indicators.createMany({
            data: dto.indicators.map((indicator) => ({
              project_indicator: project.id,
              label: indicator.label,
              value: indicator.value,
              measure: indicator.measure,
              source: indicator.source,
              year: indicator.year,
            })),
          });
        }
      }

      await tx.projects_logs.create({
        data: {
          user: BigInt(userId),
          action: 'editou',
          project: project.id,
          moment,
        },
      });

      return tx.projects.findUnique({
        where: { id: project.id },
        include: {
          awards: true,
          indicators: true,
        },
      });
    });

    return {
      id: updatedProject!.id.toString(),
      name: updatedProject!.name,
      user: updatedProject!.user.toString(),
      team: updatedProject!.team.toString(),
      version: updatedProject!.version.toString(),
      family: updatedProject!.family.toString(),
      short_description: updatedProject!.short_description,
      full_description: updatedProject!.full_description,
      source: updatedProject!.source,
      main_department: updatedProject!.main_department,
      related_departments: updatedProject!.related_departments,
      areas: updatedProject!.areas,
      ods: updatedProject!.ods,
      theme: updatedProject!.theme,
      audience: updatedProject!.audience,
      technologies: updatedProject!.technologies,
      implementation_date: updatedProject!.implementation_date,
      last_update: updatedProject!.last_update,
      keywords: updatedProject!.keywords,
      status: updatedProject!.status,
      awards: updatedProject!.awards,
      indicators: updatedProject!.indicators,
    };
  }

  async approve(id: string, userId: string) {
    const project = await this.prisma.projects.findUnique({
      where: { id: BigInt(id) },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const approver = await this.prisma.users_role.findFirst({
      where: {
        user: BigInt(userId),
        team: project.team,
        team_approver: true,
      },
    });

    if (!approver) {
      throw new ForbiddenException(
        'Usuário não tem permissão para aprovar projetos deste time',
      );
    }

    if (project.status !== 1) {
      throw new ForbiddenException(
        'Apenas projetos em rascunho podem ser aprovados',
      );
    }

    const updatedProject = await this.prisma.$transaction(async (tx) => {
      const moment = new Date();

      const updated = await tx.projects.update({
        where: { id: project.id },
        data: {
          status: 2,
          last_update: moment,
        },
        include: {
          awards: true,
          indicators: true,
        },
      });

      await tx.projects_logs.create({
        data: {
          user: BigInt(userId),
          action: 'aprovou',
          project: project.id,
          moment,
        },
      });

      return updated;
    });

    return {
      id: updatedProject.id.toString(),
      name: updatedProject.name,
      user: updatedProject.user.toString(),
      team: updatedProject.team.toString(),
      version: updatedProject.version.toString(),
      family: updatedProject.family.toString(),
      short_description: updatedProject.short_description,
      full_description: updatedProject.full_description,
      source: updatedProject.source,
      main_department: updatedProject.main_department,
      related_departments: updatedProject.related_departments,
      areas: updatedProject.areas,
      ods: updatedProject.ods,
      theme: updatedProject.theme,
      audience: updatedProject.audience,
      technologies: updatedProject.technologies,
      implementation_date: updatedProject.implementation_date,
      last_update: updatedProject.last_update,
      keywords: updatedProject.keywords,
      status: updatedProject.status,
      awards: updatedProject.awards,
      indicators: updatedProject.indicators,
    };
  }

  async deactivate(id: string, userId: string) {
    const project = await this.prisma.projects.findUnique({
      where: { id: BigInt(id) },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const approver = await this.prisma.users_role.findFirst({
      where: {
        user: BigInt(userId),
        team: project.team,
        team_approver: true,
      },
    });

    if (!approver) {
      throw new ForbiddenException(
        'Usuário não tem permissão para inativar projetos deste time',
      );
    }

    if (project.status !== 2) {
      throw new ForbiddenException(
        'Apenas projetos ativos podem ser inativados',
      );
    }

    const updatedProject = await this.prisma.$transaction(async (tx) => {
      const moment = new Date();

      const updated = await tx.projects.update({
        where: { id: project.id },
        data: {
          status: 3,
          last_update: moment,
        },
        include: {
          awards: true,
          indicators: true,
        },
      });

      await tx.projects_logs.create({
        data: {
          user: BigInt(userId),
          action: 'inativou',
          project: project.id,
          moment,
        },
      });

      return updated;
    });

    return {
      id: updatedProject.id.toString(),
      name: updatedProject.name,
      user: updatedProject.user.toString(),
      team: updatedProject.team.toString(),
      version: updatedProject.version.toString(),
      family: updatedProject.family.toString(),
      short_description: updatedProject.short_description,
      full_description: updatedProject.full_description,
      source: updatedProject.source,
      main_department: updatedProject.main_department,
      related_departments: updatedProject.related_departments,
      areas: updatedProject.areas,
      ods: updatedProject.ods,
      theme: updatedProject.theme,
      audience: updatedProject.audience,
      technologies: updatedProject.technologies,
      implementation_date: updatedProject.implementation_date,
      last_update: updatedProject.last_update,
      keywords: updatedProject.keywords,
      status: updatedProject.status,
      awards: updatedProject.awards,
      indicators: updatedProject.indicators,
    };
  }

  async reject(id: string, userId: string) {
    const project = await this.prisma.projects.findUnique({
      where: { id: BigInt(id) },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const approver = await this.prisma.users_role.findFirst({
      where: {
        user: BigInt(userId),
        team: project.team,
        team_approver: true,
      },
    });

    if (!approver) {
      throw new ForbiddenException(
        'Usuário não tem permissão para rejeitar projetos deste time',
      );
    }

    if (project.status !== 1) {
      throw new ForbiddenException(
        'Apenas projetos em rascunho podem ser rejeitados',
      );
    }

    await this.prisma.projects.delete({
      where: { id: project.id },
    });

    return { ok: true };
  }

  async find(
    filters: {
      id?: string;
      name?: string;
      user?: string;
      team?: string;
      family?: string;
      main_department?: string;
      related_departments?: string;
      areas?: string;
      ods?: string;
      theme?: string;
      awards?: string;
      keywords?: string;
      status?: string;
      implementation_date?: string;
    },
    userId: string,
  ) {
    const authenticatedUserId = BigInt(userId);

    const authenticatedUser = await this.prisma.users.findUnique({
      where: { id: authenticatedUserId },
      select: { head_manager: true },
    });

    if (!authenticatedUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const where: any = {};

    if (filters.id !== undefined) {
      where.id = BigInt(filters.id);
    }

    if (filters.name !== undefined) {
      where.name = {
        equals: filters.name,
        mode: 'insensitive',
      };
    }

    if (filters.user !== undefined) {
      where.user = BigInt(filters.user);
    }

    if (filters.team !== undefined) {
      where.team = BigInt(filters.team);
    }

    if (filters.family !== undefined) {
      where.family = BigInt(filters.family);
    }

    if (filters.main_department !== undefined) {
      where.main_department = filters.main_department;
    }

    if (filters.related_departments !== undefined) {
      where.related_departments = {
        hasEvery: filters.related_departments.split(','),
      };
    }

    if (filters.areas !== undefined) {
      where.areas = {
        hasEvery: filters.areas.split(','),
      };
    }

    if (filters.ods !== undefined) {
      where.ods = {
        hasEvery: filters.ods.split(',').map(Number),
      };
    }

    if (filters.theme !== undefined) {
      where.theme = filters.theme;
    }

    if (filters.status !== undefined) {
      where.status = Number(filters.status);
    }

    if (filters.implementation_date !== undefined) {
      if (filters.implementation_date === 'null') {
        where.implementation_date = null;
      } else {
        where.implementation_date = new Date(
          filters.implementation_date,
        );
      }
    }

    // O head-manager pode consultar todos os projetos.
    if (!authenticatedUser.head_manager) {
      const managerRoles = await this.prisma.users_role.findMany({
        where: {
          user: authenticatedUserId,
          OR: [
            { sector_manager: true },
            { team_manager: true },
          ],
        },
        select: {
          sector: true,
          team: true,
          sector_manager: true,
          team_manager: true,
        },
      });

      if (managerRoles.length > 0) {
        // Setores gerenciados pelo usuário.
        const sectorIds = Array.from(
          new Set(
            managerRoles.flatMap((role) =>
              role.sector_manager && role.sector !== null
                ? [role.sector]
                : [],
            ),
          ),
        );

        // Times gerenciados diretamente pelo usuário.
        const managedTeamIds = Array.from(
          new Set(
            managerRoles.flatMap((role) =>
              role.team_manager && role.team !== null
                ? [role.team]
                : [],
            ),
          ),
        );

        // Todos os times pertencentes aos setores gerenciados.
        const teamsFromSectors =
          sectorIds.length > 0
            ? await this.prisma.teams.findMany({
                where: {
                  sector: {
                    in: sectorIds,
                  },
                },
                select: {
                  id: true,
                },
              })
            : [];

        // Junta os times dos setores e os times gerenciados diretamente.
        const allowedTeamIds = Array.from(
          new Set([
            ...managedTeamIds,
            ...teamsFromSectors.map((team) => team.id),
          ]),
        );

        // O usuário gerente só consulta projetos dentro do seu escopo.
        where.AND = [
          ...(where.AND ?? []),
          {
            team: {
              in: allowedTeamIds,
            },
          },
        ];
      } else {
        // Usuários sem função gerencial só consultam projetos próprios.
        // A restrição continua válida mesmo que a URL informe outro user.
        where.AND = [
          ...(where.AND ?? []),
          {
            user: authenticatedUserId,
          },
        ];
      }
    }

    let projects = await this.prisma.projects.findMany({
      where,
      orderBy: { version: 'asc' },
      include: {
        awards: true,
        indicators: true,
      },
    });

    if (filters.awards !== undefined) {
      const awards = filters.awards
        .split(',')
        .map(normalizeText);

      projects = projects.filter((project) =>
        awards.every((award) =>
          project.awards.some(
            (projectAward) =>
              normalizeText(projectAward.institution) === award,
          ),
        ),
      );
    }

    if (filters.keywords !== undefined) {
      const keywords = filters.keywords
        .split(',')
        .map(normalizeText);

      projects = projects.filter((project) =>
        keywords.every((keyword) =>
          project.keywords.some(
            (projectKeyword) =>
              normalizeText(projectKeyword) === keyword,
          ),
        ),
      );
    }

    return Promise.all(
      projects.map(async (project) => ({
        id: project.id.toString(),
        name: project.name,
        user: project.user.toString(),
        team: project.team.toString(),
        version: project.version.toString(),
        family: project.family.toString(),
        short_description: project.short_description,
        full_description: project.full_description,
        source: await this.mapSources(project.source),
        main_department: project.main_department,
        related_departments: project.related_departments,
        areas: project.areas,
        ods: project.ods,
        theme: project.theme,
        audience: project.audience,
        technologies: project.technologies,
        implementation_date: project.implementation_date,
        last_update: project.last_update,
        keywords: project.keywords,
        status: project.status,
        awards: project.awards,
        indicators: project.indicators,
      })),
    );
  }
}