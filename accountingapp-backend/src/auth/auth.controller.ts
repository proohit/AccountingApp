import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { SecureUser } from '../users/entities/secure-user';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './authenticated.guard';
import CreateUserDto from './dtos/create-user.dto';
import { LocalAuthGuard } from './local.guard';
import { LoggedInUser } from './user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@LoggedInUser() user: SecureUser) {
    return user;
  }

  @Post('register')
  async register(@Request() req, @Body() user: CreateUserDto) {
    return new Promise(async (resolve, reject) => {
      try {
        const newUser = await this.authService.register(
          user.username,
          user.password,
          user.email,
        );
        req.login(newUser, (err) => {
          if (err) {
            reject(err);
          }
          resolve(newUser);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  @UseGuards(AuthenticatedGuard)
  @Post('logout')
  async logout(@Request() req) {
    await req.session.destroy();
  }
}
