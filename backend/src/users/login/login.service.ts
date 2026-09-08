import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeCpf, normalizeEmail } from '../../common/normalizer';

@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }
  async login(login: string, password: string) {
    const normalizedLoginEmail = normalizeEmail(login);
    const normalizedLoginCpf = normalizeCpf(login);
    const user = await this.prisma.users.findFirst({
      where: { OR: [{ email: normalizedLoginEmail }, { cpf: normalizedLoginCpf }] },
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

    const payload = { sub: user.id.toString(), email: user.email };
    const token = await this.jwtService.signAsync(payload);

    const primaryTeamEntry = user.users_teams[0] ?? null;
    const team = primaryTeamEntry?.teams ?? null;
    const sector = team?.sectors ?? null;

    return {
      access_token: token,
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        photo: user.photo ?? null,
        teamId: team?.id?.toString() ?? null,
        teamName: team?.name ?? null,
        sectorId: sector?.id?.toString() ?? null,
        sectorName: sector?.name ?? null,
        accessLevel: team?.level_acess ?? 0,
        areaManager: primaryTeamEntry?.area_manager ?? false,
        areaEditor: primaryTeamEntry?.area_editor ?? false,
        approver: primaryTeamEntry?.approver ?? false,
      },
    };
  }
}