import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeCpf, normalizeText } from '../../common/normalizer';

@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async login(login: string, password: string) {
    const normalizedLoginEmail = normalizeText(login);
    const normalizedLoginCpf = normalizeCpf(login);

    const user = await this.prisma.users.findFirst({
      where: {
        OR: [
          { email: normalizedLoginEmail },
          { cpf: normalizedLoginCpf },
        ],
      },
      include: {
        users_role: {
          include: {
            teams: true,
            sectors: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou CPF inválidos');
    }

    if (!user.status) {
      throw new UnauthorizedException('Usuário desativado');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Email ou CPF inválidos');
    }

    const payload = {
      sub: user.id.toString(),
      email: user.email,
    };

    const token = await this.jwtService.signAsync(payload);

    const teams = user.users_role
      .filter((userRole) => userRole.team !== null && userRole.teams !== null)
      .map((userRole) => ({
        id: userRole.teams!.id.toString(),
        name: userRole.teams!.name,
        sectorId: userRole.sector.toString(),
        sectorName: userRole.sectors.name,
        areaManager: userRole.team_manager,
        approver: userRole.team_approver,
      }));

    const primaryRole = user.users_role.find(
      (userRole) => userRole.team !== null && userRole.teams !== null
    ) ?? user.users_role[0] ?? null;

    const primaryTeam = primaryRole?.teams ?? null;
    const primarySector = primaryRole?.sectors ?? null;

    return {
      access_token: token,
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        photo: user.photo ?? null,

        // Mantidos para compatibilidade com o frontend atual.
        teamId: primaryTeam?.id?.toString() ?? null,
        teamName: primaryTeam?.name ?? null,
        sectorId: primarySector?.id?.toString() ?? null,
        sectorName: primarySector?.name ?? null,
        areaManager: primaryRole?.team_manager ?? false,
        approver: primaryRole?.team_approver ?? false,

        // Lista completa dos vínculos do usuário com os times.
        teams,

        head_manager: user.head_manager,
      },
    };
  }
}