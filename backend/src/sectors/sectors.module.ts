import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SectorsController } from './sectors.controller';
import { SectorsService } from './sectors.service';

@Module({
  imports: [ PrismaModule ],
  controllers: [ SectorsController ],
  providers: [ SectorsService ]
})
export class SectorsModule {}