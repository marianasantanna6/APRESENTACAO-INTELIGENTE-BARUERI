import { Body, Controller, Post } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';

@Controller('password-reset')
export class PasswordResetController {
  constructor(
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('forgot-password')
  requestPasswordReset(
    @Body('email') email: string,
  ) {
    return this.passwordResetService.requestPasswordReset(email);
  }

  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.passwordResetService.resetPassword(
      token,
      newPassword,
    );
  }
}