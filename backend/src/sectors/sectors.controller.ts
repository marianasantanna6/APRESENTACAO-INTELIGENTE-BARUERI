import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SectorsService } from './sectors.service';
import { CreateSectorsDto } from './dto/inputs-sectors.dto';

@Controller('sectors')
export class SectorsController {
  constructor(
    private readonly sectorsService: SectorsService,
  ) {}

  @Post()
  create(@Body() dto: CreateSectorsDto) {
    return this.sectorsService.create(dto);
  }

  @Get()
  find(
    @Query('id') id?: string,
    @Query('name') name?: string,
  ) {
    return this.sectorsService.find({
      id,
      name,
    });
  }
}