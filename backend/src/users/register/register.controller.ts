import { Body, Controller, Post } from '@nestjs/common';
import { RegisterService } from './register.service';
import { CreateRegisterDto } from './dto/inputs-register.dto';

@Controller('register')
export class RegisterController {
  constructor(
    private readonly registerService: RegisterService,
  ) { }
  @Post()
  create(@Body() dto: CreateRegisterDto) {

    return this.registerService.create(dto);

  }
}