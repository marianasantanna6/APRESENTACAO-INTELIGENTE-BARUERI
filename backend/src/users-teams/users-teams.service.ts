import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsersTeamsDto } from './dto/inputs-users-teams.dto';

@Injectable()
export class UsersTeamsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateUsersTeamsDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(dto.user) } ,
    });
    if (!user) {
      throw new NotFoundException( 'Usuário não encontrado' );
    }

    const team = await this.prisma.teams.findUnique({
      where: { id: BigInt(dto.team) },
    });
    if (!team) {
      throw new NotFoundException( 'Time não encontrado' );
    }

    const existingUsersTeam =
      await this.prisma.users_teams.findFirst({
        where: {
          user: BigInt(dto.user),
          team: BigInt(dto.team),
        },
      });
    if (existingUsersTeam) {
      throw new ConflictException( 'Usuário já está vinculado a este time' );
    }

    const usersTeam =
      await this.prisma.users_teams.create({
        data: {
          user: BigInt(dto.user),
          team: BigInt(dto.team),
          area_manager:
            dto.area_manager ?? false,
          area_editor:
            dto.area_editor ?? false,
          approver:
            dto.approver ?? false,
        },
      });
    return {
      id: usersTeam.id.toString(),
      user: usersTeam.user.toString(),
      team: usersTeam.team.toString(),
      area_manager:
        usersTeam.area_manager,
      area_editor:
        usersTeam.area_editor,
      approver:
        usersTeam.approver,
    };
  }

  async find(filters: {
    user?: string;
    team?: string;
    area_manager?: string;
    area_editor?: string;
    approver?: string;
  }) {
    const where: any = {};
    if (filters.user !== undefined) {
      where.user = BigInt(filters.user);
    }

    if (filters.team !== undefined) {
      where.team = BigInt(filters.team);
    }

    if (filters.area_manager !== undefined) {
      where.area_manager =
        filters.area_manager === 'true';
    }

    if (filters.area_editor !== undefined) {
      where.area_editor =
        filters.area_editor === 'true';
    }

    if (filters.approver !== undefined) {
      where.approver =
        filters.approver === 'true';
    }

    const usersTeams =
      await this.prisma.users_teams.findMany({
        where, orderBy: { id: 'asc' },
      });
    return usersTeams.map((usersTeam) => ({
      id: usersTeam.id.toString(),
      user: usersTeam.user.toString(),
      team: usersTeam.team.toString(),
      area_manager:
        usersTeam.area_manager,
      area_editor:
        usersTeam.area_editor,
      approver:
        usersTeam.approver,
    }));
  }
}