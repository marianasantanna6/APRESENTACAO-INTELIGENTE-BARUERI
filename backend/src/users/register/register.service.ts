import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeCpf, normalizeText } from '../../common/normalizer';
import {
  deleteProfilePicture,
  uploadProfilePicture,
} from '../../common/profile-picture-storage';
import { CreateRegisterDto } from './dto/inputs-register.dto';

@Injectable()
export class RegisterService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }
  async create(dto: CreateRegisterDto, actorId: string) {
    const actor = await this.prisma.users.findUnique({
      where: { id: BigInt(actorId) },
    });

    if (!actor) {
      throw new NotFoundException('Usuário autenticado não encontrado');
    }

    if (!actor.head_manager) {
      throw new ForbiddenException(
        'Apenas head-manager pode criar usuários',
      );
    }

    const cpf = normalizeCpf(dto.cpf);
    const email = normalizeText(dto.email);

    if (!email.endsWith('@barueri.sp.gov.br')) {
      throw new BadRequestException(
        'Apenas emails @barueri.sp.gov.br podem ser cadastrados',
      );
    }

    const existingUser = await this.prisma.users.findFirst({
      where: { OR: [{ email }, { cpf }] }
    });
    if (existingUser) {
      throw new ConflictException('CPF ou email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(
      dto.password, 10
    );
    const uploadedPhoto = dto.photo?.startsWith('data:')
      ? await uploadProfilePicture(dto.photo)
      : undefined;

    let user;
    try {
      user = await this.prisma.users.create({
        data: {
          name: dto.name,
          email,
          password: hashedPassword,
          cpf,
          photo: uploadedPhoto?.publicUrl ?? dto.photo,
        },
      });
    } catch (error) {
      if (uploadedPhoto) {
        await deleteProfilePicture(uploadedPhoto.path).catch(() => undefined);
      }

      throw error;
    }

    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      photo: user.photo,
      head_manager: user.head_manager,
      status: user.status,
    };
  }
}
