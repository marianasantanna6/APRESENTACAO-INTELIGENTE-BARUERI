import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { RegisterService } from './register.service';
import { CreateRegisterDto } from './dto/inputs-register.dto';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@Controller('register')
export class RegisterController {
  constructor(
    private readonly registerService: RegisterService,
  ) { }
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateRegisterDto,
    @Req() req: any,
  ) {

    return this.registerService.create(dto, req.user.id);

  }
}