import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectsDto } from './dto/inputs-projects.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  async create(dto: CreateProjectsDto) {
    return this.prisma.$transaction(async (tx) => {

      /* Conferimos os IDs dos departamentos relacionados antes de criar o projeto. */

      const relatedDepartmentIds = [
        ...new Set(
          (dto.related_departments ?? []).map((department) =>
            BigInt(department),
          ),
        ),
      ];

      /*  Conferimos os IDs das áreas antes de criar o projeto. */

      const areaIds = [
        ...new Set(
          (dto.areas ?? []).map((area) =>
            BigInt(area),
          ),
        ),
      ];
      const departments = await tx.departments.findMany({
        where: { id: { in: relatedDepartmentIds } },
      });

      if (departments.length !== relatedDepartmentIds.length) {
        throw new NotFoundException( 'Um ou mais departamentos não foram encontrados' );
      }
      const areas = await tx.areas.findMany({
        where: { id: { in: areaIds } },
      });

      if (areas.length !== areaIds.length) {
        throw new NotFoundException( 'Uma ou mais áreas não foram encontradas' );
      }
      let family: bigint;
      let version: bigint;

      /* NOVO PROJETO. O Front não enviou family. */

      if (dto.family === undefined) {
        version = 1n;

        /* Primeiro criamos o projeto. O banco gera o ID automaticamente. */

        const project = await tx.projects.create({
          data: {
            name: dto.name,
            user: BigInt(dto.user),
            version,
            family: 0n,
            short_description: dto.short_description,
            full_description: dto.full_description,
            source: dto.source,
            main_department: BigInt(dto.main_department),
            related_departments: relatedDepartmentIds,
            areas: areaIds,
            ods: dto.ods ?? [],
            theme: dto.theme,
            audience: dto.audience,
            technologies: dto.technologies,

            implementation_date:
              dto.implementation_date !== undefined
                ? new Date(dto.implementation_date)
                : null,

            awards: dto.awards ?? [],
            status: true,
            last_update: new Date(),
          },
        });
        
        /* O próprio ID gerado passa a ser a referência da família. */

        family = project.id;

        /* Agora que temos o ID, preenchemos family. */

        const updatedProject = await tx.projects.update({
          where: { id: project.id }, data: { family }
        });
        return {
          id: updatedProject.id.toString(),
          name: updatedProject.name,
          user: updatedProject.user.toString(),
          version: updatedProject.version.toString(),
          family: updatedProject.family.toString(),
          short_description: updatedProject.short_description,
          full_description: updatedProject.full_description,
          source: updatedProject.source,

          main_department:
            updatedProject.main_department.toString(),

          related_departments:
            updatedProject.related_departments.map(
              (department) => department.toString(),
            ),

          areas: updatedProject.areas.map(
            (area) => area.toString(),
          ),

          ods: updatedProject.ods,
          theme: updatedProject.theme,
          audience: updatedProject.audience,
          technologies: updatedProject.technologies,

          implementation_date:
            updatedProject.implementation_date,

          awards: updatedProject.awards,
          status: updatedProject.status,
          last_update: updatedProject.last_update,
        };
      }

      /* NOVA VERSÃO. O Front enviou family. */

      family = BigInt(dto.family);

       /* Procuramos a última versão dessa família. */

      const lastProject = await tx.projects.findFirst({
        where: { family },
        orderBy: { version: 'desc' },
      });
      if (!lastProject) {
        throw new NotFoundException( 'Projeto original não encontrado' );
      }
      version = lastProject.version + 1n;

       /* Criamos uma NOVA linha. Não alteramos o projeto anterior. */

      const newProject = await tx.projects.create({
        data: {
          name: dto.name,
          user: BigInt(dto.user),
          version,
          family,
          short_description: dto.short_description,
          full_description: dto.full_description,
          source: dto.source,
          main_department: BigInt(dto.main_department),
          related_departments: relatedDepartmentIds,
          areas: areaIds,
          ods: dto.ods ?? [],
          theme: dto.theme,
          audience: dto.audience,
          technologies: dto.technologies,

          implementation_date:
            dto.implementation_date !== undefined
              ? new Date(dto.implementation_date)
              : null,

          awards: dto.awards ?? [],
          status: true,
          last_update: new Date(),
        },
      });
      return {
        id: newProject.id.toString(),
        name: newProject.name,
        user: newProject.user.toString(),
        version: newProject.version.toString(),
        family: newProject.family.toString(),
        short_description: newProject.short_description,
        full_description: newProject.full_description,
        source: newProject.source,

        main_department:
          newProject.main_department.toString(),

        related_departments:
          newProject.related_departments.map(
            (department) => department.toString(),
          ),

        areas: newProject.areas.map(
          (area) => area.toString(),
        ),

        ods: newProject.ods,
        theme: newProject.theme,
        audience: newProject.audience,
        technologies: newProject.technologies,

        implementation_date:
          newProject.implementation_date,

        awards: newProject.awards,
        status: newProject.status,
        last_update: newProject.last_update,
      };
    });
  }

  async find(filters: {
    id?: string;
    name?: string;
    user?: string;
    family?: string;
    main_department?: string;
    related_departments?: string;
    areas?: string;
    ods?: string;
    awards?: string;
    status?: string;
    implementation_date?: string;
  }) {

    const where: any = {};
    if (filters.id !== undefined) {
      where.id = BigInt(filters.id);
    }

    if (filters.name !== undefined) {
      where.name = {  equals: filters.name, mode: 'insensitive' };
    }

    if (filters.user !== undefined) {
      where.user = BigInt(filters.user);
    }

    if (filters.family !== undefined) {
      where.family = BigInt(filters.family);
    }

    if (filters.main_department !== undefined) {
      where.main_department =
        BigInt(filters.main_department);
    }

    if (filters.related_departments !== undefined) {
      where.related_departments = { has: BigInt(filters.related_departments) };
    }

    if (filters.areas !== undefined) {
      where.areas = {
        has: BigInt(filters.areas),
      };
    }

    if (filters.ods !== undefined) {
      where.ods = { has: Number(filters.ods) };
    }

    if (filters.awards !== undefined) {
      where.awards = {
        has: filters.awards,
      };
    }

    if (filters.status !== undefined) {
      where.status = filters.status === 'true';
    }

    if (filters.implementation_date !== undefined) {
      if (filters.implementation_date === 'null') {
        where.implementation_date = null;

      } else {
        where.implementation_date = new Date(  filters.implementation_date );
      }
    }
    const projects = await this.prisma.projects.findMany({
      where,
      orderBy: { version: 'asc' },
    });
    return projects.map((project) => ({
      id: project.id.toString(),
      name: project.name,
      user: project.user.toString(),
      version: project.version.toString(),
      family: project.family.toString(),
      short_description: project.short_description,
      full_description: project.full_description,
      source: project.source,

      main_department:
        project.main_department.toString(),

      related_departments:
        project.related_departments.map(
          (department) => department.toString(),
        ),

      areas: project.areas.map(
        (area) => area.toString(),
      ),

      ods: project.ods,
      theme: project.theme,
      audience: project.audience,
      technologies: project.technologies,

      implementation_date:
        project.implementation_date,

      awards: project.awards,
      status: project.status,
      last_update: project.last_update,
    }));
  }
}