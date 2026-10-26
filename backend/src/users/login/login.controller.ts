import { Body, Controller, Post } from '@nestjs/common';
import { LoginService } from './login.service';

@Controller('login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
  ) { }

  @Post() 
  login(
    @Body('login') login: string, 
    @Body('password') password: string, 
  ) {
    return this.loginService.login(login, password); 
   }
}