import { Body, Controller, Get, Post,  Query } from '@nestjs/common';
import { UsersSectorsService } from './users-sectors.service';
import { CreateUsersSectorsDto } from './dto/inputs-users-sectors.dto';

@Controller('users-sectors')
export class UsersSectorsController {
  constructor(
    private readonly usersSectorsService: UsersSectorsService,
  ) {}

  @Post()
  create(@Body() dto: CreateUsersSectorsDto) {
    return this.usersSectorsService.create(dto);
  }

  @Get()
  find(
    @Query('user') user?: string,
    @Query('sector') sector?: string,
    @Query('general_admin') general_admin?: string,
    @Query('institute_manager') institute_manager?: string,
  ) {
    return this.usersSectorsService.find({
      user,
      sector,
      general_admin,
      institute_manager,
    });
  }
}