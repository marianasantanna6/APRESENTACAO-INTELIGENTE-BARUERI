import { Controller, Get, Query } from '@nestjs/common';
import { ManagementService } from './management.service';

@Controller('management')
export class ManagementController {
  constructor(
    private readonly managementService: ManagementService,
  ) { }

  @Get()
  async find(
    @Query('id') id?: string,
    @Query('name') name?: string,
    @Query('email') email?: string,
  ) {
    if (id) {
      return this.managementService.findById(id);
    }
    if (email) {
      return this.managementService.findByEmail(email);
    }
    if (name) {
      return this.managementService.findByName(name);
    }
    return this.managementService.find();
  }
}