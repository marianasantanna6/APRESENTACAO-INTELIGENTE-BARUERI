import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../users/authentication/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectsDto } from './dto/inputs-projects.dto';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) { }

  @Post() //Cria projeto e Atualiza quando family!=NULL
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateProjectsDto,
    @Req() req: any,
  ) {
    return this.projectsService.create(dto, req.user.id);
  }

  @Patch(':id') //Altera projeto, quando ainda rascunho (status=1)
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: CreateProjectsDto,
    @Req() req: any,
  ) {
    return this.projectsService.update(id, dto, req.user.id);
  }

  @Patch(':id/approve') //Aprova projeto quando usuário é approver no team do projeto (status=1 => status=2)
  @UseGuards(JwtAuthGuard)
  approve(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.projectsService.approve(id, req.user.id);
  }

  @Patch(':id/deactivate') //Inativa projeto quando usuário é approver no team do projeto (status=2 => status=3)
  @UseGuards(JwtAuthGuard)
  deactivate(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.projectsService.deactivate(id, req.user.id);
  }

  @Delete(':id/reject') //Rejeita projeto quando usuário é approver no team do projeto
  @UseGuards(JwtAuthGuard)
  reject(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.projectsService.reject(id, req.user.id);
  }

  @Get()
  find(
    @Query('id') id?: string,
    @Query('name') name?: string,
    @Query('user') user?: string,
    @Query('family') family?: string,
    @Query('main_department') main_department?: string,
    @Query('related_departments') related_departments?: string,
    @Query('areas') areas?: string,
    @Query('ods') ods?: string,
    @Query('theme') theme?: string,
    @Query('awards') awards?: string,
    @Query('keywords') keywords?: string,
    @Query('status') status?: string,
    @Query('implementation-date') implementation_date?: string,
  ) {
    return this.projectsService.find({
      id,
      name,
      user,
      family,
      main_department,
      related_departments,
      areas,
      ods,
      theme,
      awards,
      keywords,
      status,
      implementation_date,
    });
  }
}