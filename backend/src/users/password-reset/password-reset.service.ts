
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeText } from '../../common/normalizer';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async requestPasswordReset(email: string) {
    const normalizedEmail = normalizeText(email);

    const genericMessage =
      'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.';

    if (!normalizedEmail) {
      return { message: genericMessage };
    }

    const user = await this.prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.status) {
      return { message: genericMessage };
    }

    const passwordVersion = createHash('sha256')
      .update(user.password)
      .digest('hex');

    const token = await this.jwtService.signAsync(
      {
        sub: user.id.toString(),
        purpose: 'password_reset',
        passwordVersion,
        jti: randomUUID(),
      },
      {
        secret: this.configService.getOrThrow<string>(
          'PASSWORD_RESET_SECRET',
        ),
        expiresIn: '30m',
      },
    );

    const frontendUrl = this.configService
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/+$/, '');

    const resetLink =
      `${frontendUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.getOrThrow<string>('GMAIL_USER'),
          pass: this.configService
            .getOrThrow<string>('GMAIL_APP_PASSWORD')
            .replace(/\s/g, ''),
        },
      });

      await transporter.sendMail({
        from: {
          name: 'Equipe Apresentações Inteligentes Barueri',
          address: this.configService.getOrThrow<string>('GMAIL_USER'),
        },
        to: user.email,
        subject: 'Redefinição de Palavra Passe',
        text: [
          'Parece que você solicitou a redefinição da sua senha!',
          '',
          'Acesse o link abaixo para cadastrar uma nova senha:',
          resetLink,
          '',
          'Este link expira em 30 minutos.',
          'Se você não solicitou a recuperação, ignore este e-mail.',
        ].join('\n'),
        html: `
          <h2>Redefinição de Palavra Passe</h2>
          <p>Parece que você solicitou a redefinição da sua senha!</p>
          <p>
            <a href="${resetLink}">Clique aqui para redefinir sua senha</a>
          </p>
          <p>Este link expira em 30 minutos.</p>
          <p>Se você não solicitou a recuperação, ignore este e-mail.</p>
        `,
      });
    } catch (error) {
      this.logger.error(
        'Não foi possível enviar o e-mail de recuperação de senha.',
        error instanceof Error ? error.stack : String(error),
      );
    }

    return { message: genericMessage };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException(
        'Token e nova senha são obrigatórios',
      );
    }

    if (newPassword.length < 8) {
      throw new BadRequestException(
        'A senha deve ter pelo menos 8 caracteres',
      );
    }

    let payload: {
      sub: string;
      purpose: string;
      passwordVersion: string;
      jti: string;
    };

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>(
          'PASSWORD_RESET_SECRET',
        ),
      });
    } catch {
      throw new UnauthorizedException(
        'Link de recuperação inválido ou expirado',
      );
    }

    if (
      payload.purpose !== 'password_reset' ||
      !payload.sub ||
      !payload.passwordVersion ||
      !payload.jti
    ) {
      throw new UnauthorizedException(
        'Link de recuperação inválido ou expirado',
      );
    }

    let userId: bigint;

    try {
      userId = BigInt(payload.sub);
    } catch {
      throw new UnauthorizedException(
        'Link de recuperação inválido ou expirado',
      );
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || !user.status) {
      throw new UnauthorizedException(
        'Link de recuperação inválido ou expirado',
      );
    }

    const currentPasswordVersion = createHash('sha256')
      .update(user.password)
      .digest('hex');

    if (currentPasswordVersion !== payload.passwordVersion) {
      throw new UnauthorizedException(
        'Link de recuperação inválido ou expirado',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message: 'Senha redefinida com sucesso',
    };
  }
}