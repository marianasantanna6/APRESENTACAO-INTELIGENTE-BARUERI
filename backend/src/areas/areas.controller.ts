import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreasDto } from './dto/inputs-areas.dto';

@Controller('areas')
export class AreasController {
  constructor(
    private readonly areasService: AreasService,
  ) {}

  @Post()
  create(@Body() dto: CreateAreasDto) {
    return this.areasService.create(dto);
  }

  @Get()
  find(
    @Query('id') id?: string,
    @Query('name') name?: string,
  ) {
    return this.areasService.find({
      id,
      name,
    });
  }
}