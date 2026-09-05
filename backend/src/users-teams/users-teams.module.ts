import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersTeamsController } from './users-teams.controller';
import { UsersTeamsService } from './users-teams.service';

@Module({
  imports: [ PrismaModule ],
  controllers: [ UsersTeamsController ],
  providers: [ UsersTeamsService ]
})
export class UsersTeamsModule {}