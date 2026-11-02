
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeText } from '../common/normalizer';
import { CreateProjectsDto } from './dto/inputs-projects.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async requestAi(
    dto: CreateProjectsDto,
  ): Promise<Buffer> {
    let response: Response;

    try {
      response = await fetch(
        'http://localhost:8000/research',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept:
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          },
          body: JSON.stringify(dto),
          signal: AbortSignal.timeout(120_000),
        },
      );
    } catch {
      throw new BadGatewayException(
        'Não foi possível conectar ao serviço de IA',
      );
    }

    if (!response.ok) {
      const details = await response.text().catch(() => '');

      throw new BadGatewayException(
        `O serviço de IA retornou HTTP ${response.status}${
          details ? `: ${details.slice(0, 500)}` : ''
        }`,
      );
    }

    const contentType =
      response.headers.get('content-type') ?? '';

    if (
      contentType.includes('application/json') ||
      contentType.includes('text/')
    ) {
      const details = await response.text().catch(() => '');

      throw new BadGatewayException(
        `O serviço de IA não retornou o arquivo PPTX${
          details ? `: ${details.slice(0, 500)}` : ''
        }`,
      );
    }

    let buffer: Buffer;

    try {
      buffer = Buffer.from(await response.arrayBuffer());
    } catch {
      throw new BadGatewayException(
        'Não foi possível receber o arquivo PPTX da IA',
      );
    }

    if (buffer.length === 0) {
      throw new BadGatewayException(
        'O serviço de IA retornou um arquivo vazio',
      );
    }

    // Um arquivo PPTX é um pacote ZIP.
    if (
      buffer.length < 4 ||
      buffer[0] !== 0x50 ||
      buffer[1] !== 0x4b
    ) {
      throw new BadGatewayException(
        'A resposta da IA não parece ser um arquivo PPTX válido',
      );
    }

    return buffer;
  }

  private async validateCreateRequest(
    dto: CreateProjectsDto,
    userId: string,
  ): Promise<void> {
    const authenticatedUserId = BigInt(userId);
    const responsibleUserId = BigInt(dto.user);

    const user = await this.prisma.users.findUnique({
      where: { id: authenticatedUserId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const responsibleUser =
      await this.prisma.users.findUnique({
        where: { id: responsibleUserId },
      });

    if (!responsibleUser) {
      throw new NotFoundException(
        'Usuário responsável não encontrado',
      );
    }

    if (responsibleUserId !== authenticatedUserId) {
      throw new ForbiddenException(
        'O usuário responsável deve ser o usuário autenticado',
      );
    }

    if (dto.family === 0) {
      const teamId = BigInt(dto.team);

      const team = await this.prisma.teams.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new NotFoundException('Time não encontrado');
      }

      const userRole =
        await this.prisma.users_role.findFirst({
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

      return;
    }

    const family = BigInt(dto.family);

    const lastProject =
      await this.prisma.projects.findFirst({
        where: { family },
        orderBy: { version: 'desc' },
      });

    if (!lastProject) {
      throw new NotFoundException(
        'Projeto original não encontrado',
      );
    }

    if (lastProject.status === 1) {
      throw new ForbiddenException(
        'Projetos em rascunho não podem ser atualizados',
      );
    }

    const userRole =
      await this.prisma.users_role.findFirst({
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
  }

  private async uploadPptxToSupabase(
    pptxBuffer: Buffer,
  ): Promise<{ path: string; publicUrl: string }> {
    const supabaseUrl =
      process.env.SUPABASE_URL?.replace(/\/+$/, '');
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;
    const bucketName = process.env.SUPABASE_BUCKET_NAME;

    if (!supabaseUrl || !supabaseKey || !bucketName) {
      throw new InternalServerErrorException(
        'Configuração do Supabase incompleta',
      );
    }

    const path = `projects/${randomUUID()}.pptx`;

    const encodedPath = path
      .split('/')
      .map(encodeURIComponent)
      .join('/');

    const encodedBucket = encodeURIComponent(bucketName);

    let response: Response;

    try {
      response = await fetch(
        `${supabaseUrl}/storage/v1/object/${encodedBucket}/${encodedPath}`,
        {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'x-upsert': 'false',
          },
          body: new Uint8Array(pptxBuffer),
          signal: AbortSignal.timeout(60_000),
        },
      );
    } catch {
      throw new BadGatewayException(
        'Não foi possível enviar o PPTX ao Supabase Storage',
      );
    }

    if (!response.ok) {
      const details = await response.text().catch(() => '');

      throw new BadGatewayException(
        `Falha no upload para o Supabase: HTTP ${response.status}${
          details ? `: ${details.slice(0, 500)}` : ''
        }`,
      );
    }

    return {
      path,
      publicUrl:
        `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`,
    };
  }

  private async deletePptxFromSupabase(
    path: string,
  ): Promise<void> {
    const supabaseUrl =
      process.env.SUPABASE_URL?.replace(/\/+$/, '');
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;
    const bucketName = process.env.SUPABASE_BUCKET_NAME;

    if (!supabaseUrl || !supabaseKey || !bucketName) {
      throw new Error(
        'Configuração do Supabase incompleta',
      );
    }

    const encodedPath = path
      .split('/')
      .map(encodeURIComponent)
      .join('/');

    const encodedBucket = encodeURIComponent(bucketName);

    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/${encodedBucket}/${encodedPath}`,
      {
        method: 'DELETE',
        headers: {
          apikey: supabaseKey,
        },
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!response.ok) {
      throw new Error(
        'Não foi possível remover o PPTX do Supabase',
      );
    }
  }

  private async getSourceName(
    url: string,
  ): Promise<string> {
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
    } catch {
      // Usa o hostname como alternativa.
    }

    try {
      return new URL(url).hostname.replace(/^www\./, '');
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

  async create(
    dto: CreateProjectsDto,
    userId: string,
  ) {
    // Valida antes de chamar serviços externos.
    await this.validateCreateRequest(dto, userId);

    // Temporariamente, ia_prompt não é enviado à IA.
    // O campo será enviado quando a API Python estiver atualizada.
    const pptxBuffer = await this.requestAi(dto);

    // Envia o arquivo para o bucket público.
    const storedSlides =
      await this.uploadPptxToSupabase(pptxBuffer);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const authenticatedUserId = BigInt(userId);
        const responsibleUserId = BigInt(dto.user);

        const user = await tx.users.findUnique({
          where: { id: authenticatedUserId },
        });

        if (!user) {
          throw new NotFoundException(
            'Usuário não encontrado',
          );
        }

        const responsibleUser =
          await tx.users.findUnique({
            where: { id: responsibleUserId },
          });

        if (!responsibleUser) {
          throw new NotFoundException(
            'Usuário responsável não encontrado',
          );
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
            throw new NotFoundException(
              'Time não encontrado',
            );
          }

          const userRole =
            await tx.users_role.findFirst({
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
              slides_url: storedSlides.publicUrl,
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
                      create: dto.indicators.map(
                        (indicator) => ({
                          label: indicator.label,
                          value: indicator.value,
                          measure: indicator.measure,
                          source: indicator.source,
                          year: indicator.year,
                        }),
                      ),
                    },
                  }
                : {}),
            },
            include: {
              awards: true,
              indicators: true,
            },
          });

          // O próprio ID do projeto identifica sua família.
          family = project.id;

          const updatedProject =
            await tx.projects.update({
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
            slides_url: updatedProject.slides_url,
            short_description:
              updatedProject.short_description,
            full_description:
              updatedProject.full_description,
            source: updatedProject.source,
            main_department: updatedProject.main_department,
            related_departments:
              updatedProject.related_departments,
            areas: updatedProject.areas,
            ods: updatedProject.ods,
            theme: updatedProject.theme,
            audience: updatedProject.audience,
            technologies: updatedProject.technologies,
            implementation_date:
              updatedProject.implementation_date,
            last_update: updatedProject.last_update,
            keywords: updatedProject.keywords,
            status: updatedProject.status,
            awards: updatedProject.awards,
            indicators: updatedProject.indicators,
          };
        }

        // NOVA VERSÃO
        family = BigInt(dto.family);

        const lastProject =
          await tx.projects.findFirst({
            where: { family },
            orderBy: { version: 'desc' },
          });

        if (!lastProject) {
          throw new NotFoundException(
            'Projeto original não encontrado',
          );
        }

        if (lastProject.status === 1) {
          throw new ForbiddenException(
            'Projetos em rascunho não podem ser atualizados',
          );
        }

        const userRole =
          await tx.users_role.findFirst({
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
            slides_url: storedSlides.publicUrl,
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
                    create: dto.indicators.map(
                      (indicator) => ({
                        label: indicator.label,
                        value: indicator.value,
                        measure: indicator.measure,
                        source: indicator.source,
                        year: indicator.year,
                      }),
                    ),
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
          slides_url: newProject.slides_url,
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
          implementation_date:
            newProject.implementation_date,
          last_update: newProject.last_update,
          keywords: newProject.keywords,
          status: newProject.status,
          awards: newProject.awards,
          indicators: newProject.indicators,
        };
      });
    } catch (error) {
      // A persistência falhou depois do upload:
      // tenta remover o arquivo do Storage.
      await this.deletePptxFromSupabase(storedSlides.path)
        .catch(() => undefined);

      throw error;
    }
  }

  async update(
    id: string,
    dto: CreateProjectsDto,
    userId: string,
  ) {
    const project = await this.prisma.projects.findUnique({
      where: { id: BigInt(id) },
    });

    if (!project) {
      throw new NotFoundException(
        'Projeto não encontrado',
      );
    }

    if (project.user !== BigInt(userId)) {
      throw new ForbiddenException(
        'Usuário não pode editar este projeto',
      );
    }

    const userRole =
      await this.prisma.users_role.findFirst({
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

    const updatedProject =
      await this.prisma.$transaction(async (tx) => {
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

        // ia_prompt não é persistido no banco.
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
      slides_url: updatedProject!.slides_url,
      short_description:
        updatedProject!.short_description,
      full_description:
        updatedProject!.full_description,
      source: updatedProject!.source,
      main_department: updatedProject!.main_department,
      related_departments:
        updatedProject!.related_departments,
      areas: updatedProject!.areas,
      ods: updatedProject!.ods,
      theme: updatedProject!.theme,
      audience: updatedProject!.audience,
      technologies: updatedProject!.technologies,
      implementation_date:
        updatedProject!.implementation_date,
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
      throw new NotFoundException(
        'Projeto não encontrado',
      );
    }

    const approver =
      await this.prisma.users_role.findFirst({
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

    const updatedProject =
      await this.prisma.$transaction(async (tx) => {
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
      slides_url: updatedProject.slides_url,
      short_description:
        updatedProject.short_description,
      full_description:
        updatedProject.full_description,
      source: updatedProject.source,
      main_department: updatedProject.main_department,
      related_departments:
        updatedProject.related_departments,
      areas: updatedProject.areas,
      ods: updatedProject.ods,
      theme: updatedProject.theme,
      audience: updatedProject.audience,
      technologies: updatedProject.technologies,
      implementation_date:
        updatedProject.implementation_date,
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
      throw new NotFoundException(
        'Projeto não encontrado',
      );
    }

    const approver =
      await this.prisma.users_role.findFirst({
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

    const updatedProject =
      await this.prisma.$transaction(async (tx) => {
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
      slides_url: updatedProject.slides_url,
      short_description:
        updatedProject.short_description,
      full_description:
        updatedProject.full_description,
      source: updatedProject.source,
      main_department: updatedProject.main_department,
      related_departments:
        updatedProject.related_departments,
      areas: updatedProject.areas,
      ods: updatedProject.ods,
      theme: updatedProject.theme,
      audience: updatedProject.audience,
      technologies: updatedProject.technologies,
      implementation_date:
        updatedProject.implementation_date,
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
      throw new NotFoundException(
        'Projeto não encontrado',
      );
    }

    const approver =
      await this.prisma.users_role.findFirst({
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

    const authenticatedUser =
      await this.prisma.users.findUnique({
        where: { id: authenticatedUserId },
        select: { head_manager: true },
      });

    if (!authenticatedUser) {
      throw new NotFoundException(
        'Usuário não encontrado',
      );
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

    if (!authenticatedUser.head_manager) {
      const managerRoles =
        await this.prisma.users_role.findMany({
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
        const sectorIds = Array.from(
          new Set(
            managerRoles.flatMap((role) =>
              role.sector_manager ? [role.sector] : [],
            ),
          ),
        );

        const managedTeamIds = Array.from(
          new Set(
            managerRoles.flatMap((role) =>
              role.team_manager && role.team !== null
                ? [role.team]
                : [],
            ),
          ),
        );

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

        const allowedTeamIds = Array.from(
          new Set([
            ...managedTeamIds,
            ...teamsFromSectors.map((team) => team.id),
          ]),
        );

        where.AND = [
          ...(where.AND ?? []),
          {
            team: {
              in: allowedTeamIds,
            },
          },
        ];
      } else {
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
              normalizeText(projectAward.institution) ===
              award,
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
        slides_url: project.slides_url,
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