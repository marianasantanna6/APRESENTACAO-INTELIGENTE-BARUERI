import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeText } from '../common/normalizer';
import { CreateSectorsDto } from './dto/inputs-sectors.dto';

@Injectable()
export class SectorsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateSectorsDto) {
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
    // FK onDelete: NoAction — apagar times antes de apagar o setor
    await this.prisma.teams.deleteMany({ where: { sector: BigInt(id) } });
    await this.prisma.sectors.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }
}