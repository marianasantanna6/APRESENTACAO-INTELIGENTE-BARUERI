import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeCpf, normalizeEmail } from '../../common/normalizer';
import { CreateRegisterDto } from './dto/inputs-register.dto';

@Injectable()
export class RegisterService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }
  async create(dto: CreateRegisterDto) {
    const cpf = normalizeCpf(dto.cpf);
    const email = normalizeEmail(dto.email);
    const existingUser = await this.prisma.users.findFirst({
      where: { OR: [{ email }, { cpf }] }
    });
    if (existingUser) {
      throw new ConflictException( 'CPF ou email já cadastrado' );
    }

    const hashedPassword = await bcrypt.hash(
      dto.password, 10
    );
    const user = await this.prisma.users.create({
      data: {
        name: dto.name,
        email,
        password: hashedPassword,
        cpf,
        photo: dto.photo,
      },
    });
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      cpf: user.cpf,
      photo: user.photo,
    };
  }
}