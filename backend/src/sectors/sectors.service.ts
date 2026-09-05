import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorsDto } from './dto/inputs-sectors.dto';

@Injectable()
export class SectorsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  async create(dto: CreateSectorsDto) {
    const existingSector =
      await this.prisma.sectors.findFirst({
        where: { name: dto.name }
      });
    if (existingSector) {
      throw new ConflictException( 'Setor já cadastrado' );
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
      where.name = { contains: filters.name, mode: 'insensitive' };
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
}