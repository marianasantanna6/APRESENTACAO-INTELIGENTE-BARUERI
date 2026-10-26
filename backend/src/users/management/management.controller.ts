import { Body, Controller, Delete, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';
import { ManagementService } from './management.service';

@Controller('management')
@UseGuards(JwtAuthGuard)
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
      photo?: string | null;
      head_manager?: boolean;
    },
    @Req() req: any,
  ) {
    return this.managementService.update(
      id,
      data,
      req.user.id,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Body('password') password: string,
    @Req() req: any,
  ) {
    return this.managementService.remove(id, password, req.user.id);
  }
}