import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SectorsService } from './sectors.service';
import { CreateSectorsDto } from './dto/inputs-sectors.dto';
import { JwtAuthGuard } from '../users/authentication/jwt-auth.guard';

@Controller('sectors')
export class SectorsController {
  constructor(
    private readonly sectorsService: SectorsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateSectorsDto,
    @Req() req: any,
  ) {
    return this.sectorsService.create(dto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  find(
    @Query('id') id?: string,
    @Query('name') name?: string,
  ) {
    return this.sectorsService.find({ id, name });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.sectorsService.remove(id);
  }
}