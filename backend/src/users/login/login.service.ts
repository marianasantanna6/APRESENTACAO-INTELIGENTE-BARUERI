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
        users_teams: {
          include: {
            teams: {
              include: {
                sectors: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou CPF inválidos');
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

    const teams = user.users_teams.map((userTeam) => ({
      id: userTeam.teams.id.toString(),
      name: userTeam.teams.name,
      sectorId: userTeam.teams.sector.toString(),
      sectorName: userTeam.teams.sectors.name,
      accessLevel: userTeam.teams.level_acess,
      areaManager: userTeam.area_manager,
      approver: userTeam.approver,
    }));

    const primaryTeamEntry = user.users_teams[0] ?? null;
    const primaryTeam = primaryTeamEntry?.teams ?? null;
    const primarySector = primaryTeam?.sectors ?? null;

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
        accessLevel: primaryTeam?.level_acess ?? 0,
        areaManager: primaryTeamEntry?.area_manager ?? false,
        approver: primaryTeamEntry?.approver ?? false,

        // Lista completa dos vínculos do usuário com os times.
        teams,

        master_admin: user.master_admin,
      },
    };
  }
}