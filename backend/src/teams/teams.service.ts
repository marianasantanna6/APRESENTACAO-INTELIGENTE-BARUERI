import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamsDto } from './dto/inputs-teams.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  async create(dto: CreateTeamsDto) {
    const sector = await this.prisma.sectors.findUnique({
      where: { id: BigInt(dto.sector) }
    });
    if (!sector) {
      throw new NotFoundException( 'Setor não encontrado' );
    }

    const existingTeam =
      await this.prisma.teams.findFirst({
        where: { name: dto.name },
      });
    if (existingTeam) {
      throw new ConflictException( 'Time já cadastrado' );
    }

    const team = await this.prisma.teams.create({
      data: {
        name: dto.name,
        sector: BigInt(dto.sector),
        level_acess: dto.level_acess,
      },
    });
    return {
      id: team.id.toString(),
      name: team.name,
      sector: team.sector.toString(),
      level_acess: team.level_acess,
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
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    const teams = await this.prisma.teams.findMany({
      where, orderBy: { id: 'asc' }
    });
    return teams.map((team) => ({
      id: team.id.toString(),
      name: team.name,
      sector: team.sector.toString(),
      level_acess: team.level_acess,
      status: team.status,
    }));
  }
}