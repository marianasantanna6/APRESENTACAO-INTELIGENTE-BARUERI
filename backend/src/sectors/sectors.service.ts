import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeText } from '../common/normalizer';
import { CreateSectorsDto } from './dto/inputs-sectors.dto';

@Injectable()
export class SectorsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateSectorsDto, actorId: string) {
    const actor = await this.prisma.users.findUnique({
      where: { id: BigInt(actorId) },
    });

    if (!actor) {
      throw new NotFoundException(
        'Usuário autenticado não encontrado',
      );
    }

    if (!actor.head_manager) {
      throw new ForbiddenException(
        'Apenas head-manager pode criar setores',
      );
    }

    const normalizedName = normalizeText(dto.name);

    const existingSectors =
      await this.prisma.sectors.findMany({
        where: {
          name: {
            contains: normalizedName,
            mode: 'insensitive',
          },
        },
      });

    const existingSector = existingSectors.find(
      (sector) => normalizeText(sector.name) === normalizedName,
    );

    if (existingSector) {
      throw new ConflictException('Setor já cadastrado');
    }

    const sector = await this.prisma.sectors.create({
      data: { name: dto.name },
    });

    return {
      id: sector.id.toString(),
      name: sector.name,
    };
  }

  async find(
    filters: {
      id?: string;
      name?: string;
    },
    actorId: string,
  ) {
    const authenticatedUserId = BigInt(actorId);

    const actor = await this.prisma.users.findUnique({
      where: { id: authenticatedUserId },
      select: { head_manager: true },
    });

    if (!actor) {
      throw new NotFoundException(
        'Usuário autenticado não encontrado',
      );
    }

    const where: any = {};

    if (filters.id !== undefined) {
      where.id = BigInt(filters.id);
    }

    if (filters.name !== undefined) {
      const normalizedName = normalizeText(filters.name);

      where.name = {
        contains: normalizedName,
        mode: 'insensitive',
      };
    }

    if (!actor.head_manager) {
      const actorRoles =
        await this.prisma.users_role.findMany({
          where: {
            user: authenticatedUserId,
          },
          select: {
            sector: true,
            team: true,
            sector_manager: true,
          },
        });

      // Setores nos quais o usuário é sector-manager.
      const managedSectorIds = [
        ...new Set(
          actorRoles
            .filter((role) => role.sector_manager)
            .map((role) => role.sector),
        ),
      ];

      // Times aos quais o usuário está diretamente vinculado.
      const assignedTeamIds = [
        ...new Set(
          actorRoles
            .filter((role) => role.team !== null)
            .map((role) => role.team!),
        ),
      ];

      // Descobre os setores dos times vinculados,
      // inclusive quando pertencem a outros setores administrados.
      const assignedTeams =
        assignedTeamIds.length > 0
          ? await this.prisma.teams.findMany({
              where: {
                id: {
                  in: assignedTeamIds,
                },
              },
              select: {
                sector: true,
              },
            })
          : [];

      const linkedSectorIds = assignedTeams.map(
        (team) => team.sector,
      );

      // Combina os setores administrados com os setores
      // dos times aos quais o usuário está vinculado.
      const allowedSectorIds = [
        ...new Set([
          ...managedSectorIds,
          ...linkedSectorIds,
        ]),
      ];

      if (allowedSectorIds.length === 0) {
        return [];
      }

      where.AND = [
        ...(where.AND ?? []),
        {
          id: {
            in: allowedSectorIds,
          },
        },
      ];
    }

    const sectors =
      await this.prisma.sectors.findMany({
        where,
        orderBy: { id: 'asc' },
      });

    return sectors.map((sector) => ({
      id: sector.id.toString(),
      name: sector.name,
    }));
  }

  async remove(id: string) {
    await this.prisma.sectors.delete({
      where: { id: BigInt(id) },
    });

    return { ok: true };
  }
}