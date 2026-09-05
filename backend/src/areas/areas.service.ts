import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreasDto } from './dto/inputs-areas.dto';

@Injectable()
export class AreasService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  async create(dto: CreateAreasDto) {
    const existingArea =
      await this.prisma.areas.findFirst({
        where: { name: dto.name },
      });
    if (existingArea) {
      throw new ConflictException( 'Área já cadastrada' );
    }
    const area = await this.prisma.areas.create({
      data: { name: dto.name },
    });
    return {
      id: area.id.toString(),
      name: area.name,
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

    const areas = await this.prisma.areas.findMany({
      where,
      orderBy: { id: 'asc' },
    });
    return areas.map((area) => ({
      id: area.id.toString(),
      name: area.name,
    }));
  }
}