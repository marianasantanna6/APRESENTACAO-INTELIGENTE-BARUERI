import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersSectorsController } from './users-sectors.controller';
import { UsersSectorsService } from './users-sectors.service';

@Module({
  imports: [  PrismaModule ],
  controllers: [ UsersSectorsController  ],
  providers: [ UsersSectorsService ],
})
export class UsersSectorsModule {}