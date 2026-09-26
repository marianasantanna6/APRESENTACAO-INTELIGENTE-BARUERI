import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersRoleController } from './users-role.controller';
import { UsersRoleService } from './users-role.service';

@Module({
  imports: [  PrismaModule ],
  controllers: [ UsersRoleController  ],
  providers: [ UsersRoleService ],
})
export class UsersRoleModule {}