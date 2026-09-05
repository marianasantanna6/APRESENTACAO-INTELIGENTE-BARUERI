import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsLogsController } from './projects-logs.controller';
import { ProjectsLogsService } from './projects-logs.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsLogsController],
  providers: [ProjectsLogsService]
})
export class ProjectsLogsModule {}