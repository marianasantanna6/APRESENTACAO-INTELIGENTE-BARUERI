import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AreasModule } from './areas/areas.module';
import { DepartmentsModule } from './departments/departments.module';
import { ProjectsModule } from './projects/projects.module';
import { ProjectsLogsModule } from './projects-logs/projects-logs.module';
import { SectorsModule } from './sectors/sectors.module';
import { TeamsModule } from './teams/teams.module';
import { LoginModule } from './users/login/login.module';
import { ManagementModule } from './users/management/management.module';
import { RegisterModule } from './users/register/register.module';
import { UsersSectorsModule } from './users-sectors/users-sectors.module';
import { UsersTeamsModule } from './users-teams/users-teams.module';

@Module({
  imports: [ ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AreasModule,
    DepartmentsModule,
    ProjectsModule,
    ProjectsLogsModule,
    SectorsModule,
    TeamsModule,
    LoginModule,
    ManagementModule,
    RegisterModule,
    UsersSectorsModule,
    UsersTeamsModule
  ]
})
export class AppModule { }