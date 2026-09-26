import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ProjectsLogsModule } from './projects-logs/projects-logs.module';
import { SectorsModule } from './sectors/sectors.module';
import { TeamsModule } from './teams/teams.module';
import { LoginModule } from './users/login/login.module';
import { ManagementModule } from './users/management/management.module';
import { RegisterModule } from './users/register/register.module';
import { UsersRoleModule } from './users-role/users-role.module';
import { AuthenticationModule } from './users/authentication/authentication.module';

@Module({
  imports: [ ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProjectsModule,
    ProjectsLogsModule,
    SectorsModule,
    TeamsModule,
    LoginModule,
    ManagementModule,
    RegisterModule,
    UsersRoleModule,
    AuthenticationModule
  ]
})
export class AppModule { }