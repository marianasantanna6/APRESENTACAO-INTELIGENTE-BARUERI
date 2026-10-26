import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeText } from '../common/normalizer';
import { CreateTeamsDto } from './dto/inputs-teams.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(dto: CreateTeamsDto, actorId: string) {
    const actor = await this.prisma.users.findUnique({
      where: { id: BigInt(actorId) },
    });

    if (!actor) {
      throw new NotFoundException('Usuário autenticado não encontrado');
    }

    const sector = await this.prisma.sectors.findUnique({
      where: { id: BigInt(dto.sector) }
    });
    if (!sector) {
      throw new NotFoundException('Setor não encontrado');
    }

    if (!actor.head_manager) {
      const actorRole = await this.prisma.users_role.findFirst({
        where: {
          user: BigInt(actorId),
          sector: BigInt(dto.sector),
          sector_manager: true,
        },
      });

      if (!actorRole) {
        throw new ForbiddenException(
          'Apenas head-manager ou sector-manager do setor pode criar times',
        );
      }
    }

    const normalizedName = normalizeText(dto.name);

    const existingTeams =
      await this.prisma.teams.findMany({
        where: {
          name: {
            contains: normalizedName,
            mode: 'insensitive',
          },
        },
      });

    const existingTeam = existingTeams.find(
      (team) => normalizeText(team.name) === normalizedName
    );

    if (existingTeam) {
      throw new ConflictException('Time já cadastrado');
    }

    const team = await this.prisma.teams.create({
      data: {
        name: dto.name,
        sector: BigInt(dto.sector),
      },
    });
    return {
      id: team.id.toString(),
      name: team.name,
      sector: team.sector.toString(),
      status: team.status,
    };
  }

  async find(filters: {
    id?: string;
    name?: string;
  }) {
    const where: any = {};

    if (filters.id !== undefined) {
      where.id = BigInt(filters.id);
    }

    if (filters.name !== undefined) {
      where.name = {
        contains: normalizeText(filters.name),
        mode: 'insensitive',
      };
    }

    const teams = await this.prisma.teams.findMany({
      where,
      orderBy: { id: 'asc' },
      include: { sectors: true },
    });

    return teams.map((team) => ({
      id: team.id.toString(),
      name: team.name,
      sectorId: team.sector.toString(),
      sectorName: team.sectors.name,
      status: team.status,
    }));
  }

  async remove(id: string) {
    await this.prisma.teams.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }
}