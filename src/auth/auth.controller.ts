import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: {fullname: string ,email: string; password: string }) {
    return this.authService.signup(body.fullname, body.email, body.password);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('verify')
  verify(@Query() query: { token: string }) {
    return this.authService.verifyToken(query.token);
  }
}