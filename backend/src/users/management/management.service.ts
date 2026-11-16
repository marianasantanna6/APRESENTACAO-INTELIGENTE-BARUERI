
import { Injectable, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeText } from '../../common/normalizer';
import {
  deleteProfilePicture,
  uploadProfilePicture,
} from '../../common/profile-picture-storage';

type UpdateManagementInput = {
  current_password: string;
  name?: string;
  email?: string;
  photo?: string | null;
  head_manager?: boolean;
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
      head_manager: user.head_manager,
      status: user.status,
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
      head_manager: user.head_manager,
      status: user.status,
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
      head_manager: user.head_manager,
      status: user.status,
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
      head_manager: user.head_manager,
      status: user.status,
    }));
  }

  async update(
    id: string,
    data: UpdateManagementInput,
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

    const userId = BigInt(id);

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const changingHeadManager = data.head_manager !== undefined;

    if (changingHeadManager && !actor.head_manager) {
      throw new ForbiddenException(
        'Apenas head-manager pode atribuir ou remover head-manager',
      );
    }

    const passwordToValidate = changingHeadManager
      ? actor.password
      : user.password;

    const passwordValid = await bcrypt.compare(
      data.current_password,
      passwordToValidate,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Senha inválida');
    }

    const normalizedEmail =
      data.email !== undefined
        ? normalizeText(data.email)
        : undefined;

    if (normalizedEmail !== undefined) {
      const existingUser = await this.prisma.users.findFirst({
        where: {
          email: normalizedEmail,
          NOT: {
            id: userId,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (normalizedEmail !== undefined) {
      updateData.email = normalizedEmail;
    }

    const uploadedPhoto =
      typeof data.photo === 'string' && data.photo.startsWith('data:')
        ? await uploadProfilePicture(data.photo)
        : undefined;

    if (data.photo !== undefined) {
      updateData.photo = uploadedPhoto?.publicUrl ?? data.photo;
    }

    if (data.head_manager !== undefined) {
      updateData.head_manager = data.head_manager;
    }

    let updatedUser;
    try {
      updatedUser = await this.prisma.users.update({
        where: { id: userId },
        data: updateData,
      });
    } catch (error) {
      if (uploadedPhoto) {
        await deleteProfilePicture(uploadedPhoto.path).catch(() => undefined);
      }

      throw error;
    }

    return {
      id: updatedUser.id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      password: updatedUser.password,
      cpf: updatedUser.cpf,
      photo: updatedUser.photo,
      head_manager: updatedUser.head_manager,
      status: updatedUser.status,
    };
  }

  async remove(id: string, adminEmail: string, adminPassword: string) {
    const normalizeText = (s: string) => s.trim().toLowerCase();
    const headManager = await this.prisma.users.findFirst({
      where: { email: normalizeText(adminEmail), head_manager: true },
    });

    if (!headManager) {
      throw new ForbiddenException('Head-manager não encontrado com esse e-mail');
    }

    const passwordValid = await bcrypt.compare(adminPassword, headManager.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Senha inválida');
    }

    const userId = BigInt(id);

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.prisma.users.update({
      where: { id: userId },
      data: { status: false },
    });

    return { ok: true };
  }

  async permanentDelete(id: string, adminEmail: string, adminPassword: string, actorId: string) {
    const actor = await this.prisma.users.findUnique({
      where: { id: BigInt(actorId) },
    });

    if (!actor) {
      throw new NotFoundException('Usuário autenticado não encontrado');
    }

    if (!actor.head_manager) {
      throw new ForbiddenException(
        'Apenas head-manager pode excluir usuários permanentemente',
      );
    }

    const normalizeText = (s: string) => s.trim().toLowerCase();
    if (actor.email !== normalizeText(adminEmail)) {
      throw new UnauthorizedException('E-mail não corresponde ao head-manager autenticado');
    }

    const passwordValid = await bcrypt.compare(adminPassword, actor.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Senha inválida');
    }

    const userId = BigInt(id);

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const projectCount = await this.prisma.projects.count({ where: { user: userId } });
    if (projectCount > 0) {
      throw new ForbiddenException(
        'Não é possível excluir um usuário que possui projetos cadastrados.',
      );
    }

    await this.prisma.projects_logs.deleteMany({ where: { user: userId } });
    await this.prisma.users_logs.updateMany({ where: { user: userId }, data: { user: null } });
    await this.prisma.users.delete({ where: { id: userId } });

    return { ok: true };
  }
}
