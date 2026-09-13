import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: {
      current_password: string;
      name?: string;
      email?: string;
      cpf?: string;
      photo?: string | null;
      master_admin?: boolean;
    },
  ) {
    return this.managementService.update(id, data);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    return this.managementService.remove(id, password);
  }
}