
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsersRoleDto } from './dto/inputs-create-users-role.dto';
import { UpdateUsersRoleDto } from './dto/inputs-update-users-role.dto';

@Injectable()
export class UsersRoleService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateUsersRoleDto, actorId: string) {
    const actor = await this.prisma.users.findUnique({
      where: { id: BigInt(actorId) },
    });

    if (!actor) {
      throw new NotFoundException('Usuário autenticado não encontrado');
    }

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

    let teamId: bigint | null = null;

    if (dto.team !== undefined) {
      const team = await this.prisma.teams.findUnique({
        where: { id: BigInt(dto.team) },
      });

      if (!team) {
        throw new NotFoundException( 'Time não encontrado' );
      }

      if (team.sector !== BigInt(dto.sector)) {
        throw new ConflictException(
          'O time não pertence ao setor informado',
        );
      }

      teamId = BigInt(dto.team);
    }

    const sectorManager = dto.sector_manager ?? false;
    const teamManager = dto.team_manager ?? false;
    const teamApprover = dto.team_approver ?? false;

    if ((teamManager || teamApprover) && teamId === null) {
      throw new ConflictException(
        'Team-manager e team-approver precisam estar vinculados a um time',
      );
    }

    if (!actor.head_manager) {
      const actorSectorManager = await this.prisma.users_role.findFirst({
        where: {
          user: BigInt(actorId),
          sector: BigInt(dto.sector),
          sector_manager: true,
        },
      });

      const actorTeamManager = teamId !== null
        ? await this.prisma.users_role.findFirst({
            where: {
              user: BigInt(actorId),
              team: teamId,
              team_manager: true,
            },
          })
        : null;

      if (teamId === null) {
        if (!actorSectorManager) {
          throw new ForbiddenException(
            'Apenas head-manager ou sector-manager do setor pode atribuir pessoas ao setor',
          );
        }
      } else {
        if (!actorSectorManager && !actorTeamManager) {
          throw new ForbiddenException(
            'Apenas head-manager, sector-manager do setor ou team-manager do time pode atribuir pessoas ao time',
          );
        }
      }

      if (sectorManager) {
        throw new ForbiddenException(
          'Apenas head-manager pode atribuir sector-manager',
        );
      }

      if (teamManager && !actorSectorManager) {
        throw new ForbiddenException(
          'Apenas head-manager ou sector-manager do setor pode atribuir team-manager',
        );
      }

      if (teamApprover && !actorSectorManager && !actorTeamManager) {
        throw new ForbiddenException(
          'Apenas head-manager, sector-manager do setor ou team-manager do time pode atribuir team-approver',
        );
      }
    }

    const existingUsersRole =
      await this.prisma.users_role.findFirst({
        where: {
          user: BigInt(dto.user),
          sector: BigInt(dto.sector),
          team:
            dto.team !== undefined
              ? BigInt(dto.team)
              : null,
        },
      });

    if (existingUsersRole) {
      throw new ConflictException(
        'Usuário já está vinculado a este setor e time',
      );
    }

    const usersRole =
      await this.prisma.users_role.create({
        data: {
          user: BigInt(dto.user),
          sector: BigInt(dto.sector),
          team:
            dto.team !== undefined
              ? BigInt(dto.team)
              : null,
          sector_manager:
            sectorManager,
          team_manager:
            teamManager,
          team_approver:
            teamApprover,
        },
      });

    return {
      id: usersRole.id.toString(),
      user: usersRole.user.toString(),
      sector: usersRole.sector.toString(),
      team: usersRole.team?.toString() ?? null,
      sector_manager:
        usersRole.sector_manager,
      team_manager:
        usersRole.team_manager,
      team_approver:
        usersRole.team_approver,
    };
  }

  async update(
    id: string,
    dto: UpdateUsersRoleDto,
    actorId: string,
  ) {
    const actor = await this.prisma.users.findUnique({
      where: { id: BigInt(actorId) },
    });

    if (!actor) {
      throw new NotFoundException('Usuário autenticado não encontrado');
    }

    const usersRole = await this.prisma.users_role.findUnique({
      where: { id: BigInt(id) },
    });

    if (!usersRole) {
      throw new NotFoundException(
        'Vínculo de usuário não encontrado',
      );
    }

    const sectorManager = dto.sector_manager;
    const teamManager = dto.team_manager;
    const teamApprover = dto.team_approver;

    if (
      sectorManager === undefined &&
      teamManager === undefined &&
      teamApprover === undefined
    ) {
      throw new ConflictException(
        'Nenhuma função foi informada para atualização',
      );
    }

    if (
      (teamManager === true || teamApprover === true) &&
      usersRole.team === null
    ) {
      throw new ConflictException(
        'Team-manager e team-approver precisam estar vinculados a um time',
      );
    }

    if (sectorManager !== undefined && !actor.head_manager) {
      throw new ForbiddenException(
        'Apenas head-manager pode alterar sector-manager',
      );
    }

    if (teamManager !== undefined && !actor.head_manager) {
      const actorRole = await this.prisma.users_role.findFirst({
        where: {
          user: BigInt(actorId),
          sector: usersRole.sector,
          sector_manager: true,
        },
      });

      if (!actorRole) {
        throw new ForbiddenException(
          'Apenas head-manager ou sector-manager do setor pode alterar team-manager',
        );
      }
    }

    if (teamApprover !== undefined && !actor.head_manager) {
      const actorSectorManager = await this.prisma.users_role.findFirst({
        where: {
          user: BigInt(actorId),
          sector: usersRole.sector,
          sector_manager: true,
        },
      });

      const actorTeamManager = usersRole.team !== null
        ? await this.prisma.users_role.findFirst({
            where: {
              user: BigInt(actorId),
              sector: usersRole.sector,
              team: usersRole.team,
              team_manager: true,
            },
          })
        : null;

      if (!actorSectorManager && !actorTeamManager) {
        throw new ForbiddenException(
          'Apenas head-manager, sector-manager do setor ou team-manager do time pode alterar team-approver',
        );
      }
    }

    const updateData: any = {};

    if (sectorManager !== undefined) {
      updateData.sector_manager = sectorManager;
    }

    if (teamManager !== undefined) {
      updateData.team_manager = teamManager;
    }

    if (teamApprover !== undefined) {
      updateData.team_approver = teamApprover;
    }

    const updatedUsersRole =
      await this.prisma.users_role.update({
        where: { id: BigInt(id) },
        data: updateData,
      });

    return {
      id: updatedUsersRole.id.toString(),
      user: updatedUsersRole.user.toString(),
      sector: updatedUsersRole.sector.toString(),
      team: updatedUsersRole.team?.toString() ?? null,
      sector_manager:
        updatedUsersRole.sector_manager,
      team_manager:
        updatedUsersRole.team_manager,
      team_approver:
        updatedUsersRole.team_approver,
    };
  }

  async remove(id: string, actorId: string) {
    const actor = await this.prisma.users.findUnique({
      where: { id: BigInt(actorId) },
    });

    if (!actor) {
      throw new NotFoundException('Usuário autenticado não encontrado');
    }

    const usersRole = await this.prisma.users_role.findUnique({
      where: { id: BigInt(id) },
    });

    if (!usersRole) {
      throw new NotFoundException(
        'Vínculo de usuário não encontrado',
      );
    }

    if (!actor.head_manager) {
      const actorSectorManager = await this.prisma.users_role.findFirst({
        where: {
          user: BigInt(actorId),
          sector: usersRole.sector,
          sector_manager: true,
        },
      });

      const actorTeamManager = usersRole.team !== null
        ? await this.prisma.users_role.findFirst({
            where: {
              user: BigInt(actorId),
              sector: usersRole.sector,
              team: usersRole.team,
              team_manager: true,
            },
          })
        : null;

      if (!actorSectorManager && !actorTeamManager) {
        throw new ForbiddenException(
          'Apenas head-manager, sector-manager do setor ou team-manager do time pode remover esta relação',
        );
      }
    }

    await this.prisma.users_role.delete({
      where: { id: BigInt(id) },
    });

    return { ok: true };
  }

  async find(
    filters: {
      user?: string;
      sector?: string;
      team?: string;
      sector_manager?: string;
      team_manager?: string;
      team_approver?: string;
    },
    actorId: string,
  ) {
    const actor = await this.prisma.users.findUnique({
      where: { id: BigInt(actorId) },
    });

    if (!actor) {
      throw new NotFoundException(
        'Usuário autenticado não encontrado',
      );
    }

    const filtersWhere: any = {};

    if (filters.user !== undefined) {
      filtersWhere.user = BigInt(filters.user);
    }

    if (filters.sector !== undefined) {
      filtersWhere.sector = BigInt(filters.sector);
    }

    if (filters.team !== undefined) {
      if (filters.team === 'null') {
        filtersWhere.team = null;
      } else {
        filtersWhere.team = BigInt(filters.team);
      }
    }

    if (filters.sector_manager !== undefined) {
      filtersWhere.sector_manager =
        filters.sector_manager === 'true';
    }

    if (filters.team_manager !== undefined) {
      filtersWhere.team_manager =
        filters.team_manager === 'true';
    }

    if (filters.team_approver !== undefined) {
      filtersWhere.team_approver =
        filters.team_approver === 'true';
    }

    let where = filtersWhere;

    if (!actor.head_manager) {
      const actorRoles = await this.prisma.users_role.findMany({
        where: {
          user: BigInt(actorId),
          OR: [
            { sector_manager: true },
            { team_manager: true },
          ],
        },
        select: {
          sector: true,
          team: true,
          sector_manager: true,
          team_manager: true,
        },
      });

      const sectorIds = [
        ...new Set(
          actorRoles
            .filter((role) => role.sector_manager)
            .map((role) => role.sector),
        ),
      ];

      const teamIds = [
        ...new Set(
          actorRoles
            .filter((role) => role.team_manager && role.team !== null)
            .map((role) => role.team!),
        ),
      ];

      const scopeConditions: any[] = [];

      if (sectorIds.length > 0) {
        scopeConditions.push({
          sector: { in: sectorIds },
        });
      }

      if (teamIds.length > 0) {
        scopeConditions.push({
          team: { in: teamIds },
        });
      }

      if (scopeConditions.length === 0) {
        throw new ForbiddenException(
          'Apenas head-manager, sector-manager ou team-manager pode consultar vínculos',
        );
      }

      where = {
        AND: [
          filtersWhere,
          { OR: scopeConditions },
        ],
      };
    }

    const usersRole =
      await this.prisma.users_role.findMany({
        where,
        orderBy: { id: 'asc' },
      });

    return usersRole.map((userRole) => ({
      id: userRole.id.toString(),
      user: userRole.user.toString(),
      sector: userRole.sector.toString(),
      team: userRole.team?.toString() ?? null,
      sector_manager:
        userRole.sector_manager,
      team_manager:
        userRole.team_manager,
      team_approver:
        userRole.team_approver,
    }));
  }
}