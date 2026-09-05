import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentsDto } from './dto/inputs-departments.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  async create(dto: CreateDepartmentsDto) {
    const existingDepartment =
      await this.prisma.departments.findFirst({
        where: { name: dto.name },
      });
    if (existingDepartment) {
      throw new ConflictException( 'Departamento já cadastrado' );
    }
    const department =
      await this.prisma.departments.create({
        data: { name: dto.name },
      });
    return {
      id: department.id.toString(),
      name: department.name,
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

    const departments =
      await this.prisma.departments.findMany({
        where, orderBy: { id: 'asc' },
      });

    return departments.map((department) => ({
      id: department.id.toString(),
      name: department.name,
    }));
  }
}