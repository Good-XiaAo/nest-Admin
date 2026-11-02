import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get()
  getStatus(): { message: string } {
    return { message: 'Auth route is available' };
  }
}
