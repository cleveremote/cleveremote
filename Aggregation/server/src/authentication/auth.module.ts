import { Module } from '@nestjs/common';

import { AuthService } from './services/auth.service';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserExt } from './repositories/user.ext';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuthenticationController } from './controllers/authentication.controller';
import { AccountController } from './controllers/account.controller';
import { UserController } from './controllers/user.controller';
import { ProviderController } from './controllers/provider.controller';
import { AccountExt } from './repositories/account.ext';
import { ProviderExt } from './repositories/provider.ext';
import { AccountService } from './services/account.service';
import { UserService } from './services/user.service';
import { ProviderService } from './services/provider.service';
import { GoogleAccountStrategy } from './strategies/google.account.strategy';

@Module({

  imports: [
    TypeOrmModule.forFeature([UserExt, AccountExt, ProviderExt]),
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' }
    })
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, GoogleStrategy, GoogleAccountStrategy, AccountService, UserService, ProviderService, AuthService],
  exports: [PassportModule, LocalStrategy, GoogleStrategy, GoogleAccountStrategy, AuthService, AccountService, UserService, ProviderService],
  controllers: [AuthenticationController, AccountController, UserController, ProviderController]
})
export class AuthModule { }
