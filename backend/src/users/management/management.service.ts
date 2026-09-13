import { Injectable, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeCpf, normalizeText } from '../../common/normalizer';

type UpdateManagementInput = {
  current_password: string;
  name?: string;
  email?: string;
  cpf?: string;
  photo?: string | null;
  master_admin?: boolean;
};

@Injectable()
export class ManagementService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async find() {
    const users = await this.prisma.users.findMany({
      orderBy: { id: 'asc' },
    });

    return users.map((user) => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      cpf: user.cpf,
      photo: user.photo,
      master_admin: user.master_admin,
    }));
  }

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(id) },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      cpf: user.cpf,
      photo: user.photo,
      master_admin: user.master_admin,
    };
  }

  async findByEmail(email: string) {
    const normalizedEmail = normalizeText(email);

    const user = await this.prisma.users.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      cpf: user.cpf,
      photo: user.photo,
      master_admin: user.master_admin,
    };
  }

  async findByName(name: string) {
    const users = await this.prisma.users.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
    });

    return users.map((user) => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      cpf: user.cpf,
      photo: user.photo,
      master_admin: user.master_admin,
    }));
  }

  async update(id: string, data: UpdateManagementInput) {
    const userId = BigInt(id);

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const passwordValid = await bcrypt.compare(
      data.current_password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Senha inválida');
    }

    const normalizedEmail =
      data.email !== undefined
        ? normalizeText(data.email)
        : undefined;

    const normalizedCpf =
      data.cpf !== undefined
        ? normalizeCpf(data.cpf)
        : undefined;

    if (normalizedEmail !== undefined || normalizedCpf !== undefined) {
      const existingUser = await this.prisma.users.findFirst({
        where: {
          OR: [
            ...(normalizedEmail !== undefined
              ? [{ email: normalizedEmail }]
              : []),
            ...(normalizedCpf !== undefined
              ? [{ cpf: normalizedCpf }]
              : []),
          ],
          NOT: {
            id: userId,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('CPF ou email já cadastrado');
      }
    }

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (normalizedEmail !== undefined) {
      updateData.email = normalizedEmail;
    }

    if (normalizedCpf !== undefined) {
      updateData.cpf = normalizedCpf;
    }

    if (data.photo !== undefined) {
      updateData.photo = data.photo;
    }

    if (data.master_admin !== undefined) {
      updateData.master_admin = data.master_admin;
    }

    const updatedUser = await this.prisma.users.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: updatedUser.id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      password: updatedUser.password,
      cpf: updatedUser.cpf,
      photo: updatedUser.photo,
      master_admin: updatedUser.master_admin,
    };
  }

  async remove(id: string, password: string) {
    const userId = BigInt(id);

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Senha inválida');
    }

    await this.prisma.users.delete({
      where: { id: userId },
    });

    return { ok: true };
  }
}