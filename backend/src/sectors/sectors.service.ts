import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
      throw new NotFoundException('Usuário autenticado não encontrado');
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
      (sector) => normalizeText(sector.name) === normalizedName
    );

    if (existingSector) {
      throw new ConflictException('Setor já cadastrado');
    }

    const sector =
      await this.prisma.sectors.create({
        data: { name: dto.name },
      });

    return {
      id: sector.id.toString(),
      name: sector.name,
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
      const normalizedName = normalizeText(filters.name);

      where.name = {
        contains: normalizedName,
        mode: 'insensitive',
      };
    }

    const sectors =
      await this.prisma.sectors.findMany({
        where, orderBy: { id: 'asc' },
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