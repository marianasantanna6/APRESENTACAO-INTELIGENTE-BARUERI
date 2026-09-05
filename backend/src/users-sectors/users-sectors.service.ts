import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsersSectorsDto } from './dto/inputs-users-sectors.dto';

@Injectable()
export class UsersSectorsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateUsersSectorsDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(dto.user) },
    });
    if (!user) {
      throw new NotFoundException( 'Usuário não encontrado' );
    }

    const sector = await this.prisma.sectors.findUnique({
      where: { id: BigInt(dto.sector) },
    });
    if (!sector) {
      throw new NotFoundException( 'Setor não encontrado' );
    }

    const existingUsersSector =
      await this.prisma.users_sectors.findFirst({
        where: {
          user: BigInt(dto.user),
          sector: BigInt(dto.sector),
        },
      });

    if (existingUsersSector) {
      throw new ConflictException( 'Usuário já está vinculado a este setor' );
    }

    const usersSector =
      await this.prisma.users_sectors.create({
        data: {
          user: BigInt(dto.user),
          sector: BigInt(dto.sector),
          general_admin:
            dto.general_admin ?? false,
          institute_manager:
            dto.institute_manager ?? false,
        },
      });

    return {
      id: usersSector.id.toString(),
      user: usersSector.user.toString(),
      sector: usersSector.sector.toString(),
      general_admin:
        usersSector.general_admin,
      institute_manager:
        usersSector.institute_manager,
    };
  }
  async find(filters: {
    user?: string;
    sector?: string;
    general_admin?: string;
    institute_manager?: string;
  }) {
    const where: any = {};
    if (filters.user !== undefined) {
      where.user = BigInt(filters.user);
    }

    if (filters.sector !== undefined) {
      where.sector = BigInt(filters.sector);
    }

    if (filters.general_admin !== undefined) {
      where.general_admin =
        filters.general_admin === 'true';
    }

    if (filters.institute_manager !== undefined) {
      where.institute_manager =
        filters.institute_manager === 'true';
    }

    const usersSectors =
      await this.prisma.users_sectors.findMany({
        where, orderBy: { id: 'asc' },
      });

    return usersSectors.map((usersSector) => ({
      id: usersSector.id.toString(),
      user: usersSector.user.toString(),
      sector: usersSector.sector.toString(),
      general_admin:
        usersSector.general_admin,
      institute_manager:
        usersSector.institute_manager,
    }));
  }
}