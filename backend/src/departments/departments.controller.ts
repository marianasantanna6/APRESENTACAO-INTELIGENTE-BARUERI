import { Body, Controller, Get, Post, Query, } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentsDto } from './dto/inputs-departments.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateDepartmentsDto) {
    return this.departmentsService.create(dto);
  }

  @Get()
  find(
    @Query('id') id?: string,
    @Query('name') name?: string,
  ) {
    return this.departmentsService.find({
      id,
      name,
    });
  }
}