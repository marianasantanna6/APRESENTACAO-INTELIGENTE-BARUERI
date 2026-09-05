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
      where: { OR: [{ email: normalizedLoginEmail }, { cpf: normalizedLoginCpf }], },
    });
    if (!user) {
      throw new UnauthorizedException( 'Email ou CPF inválidos' );
    }

    const passwordValid = await bcrypt.compare(
      password, user.password
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Email ou CPF inválidos');
    }

    const payload = {
      sub: user.id.toString(),
      email: user.email,
    };
    const token = await this.jwtService.signAsync(payload);
    return {
      access_token: token,
    };
  }
}