import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeEmail } from '../../common/normalizer';

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
    };
  }

  async findByEmail(email: string) {
    const normalizedEmail = normalizeEmail(email);

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
    }));
  }
}