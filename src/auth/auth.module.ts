import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AdminsModule } from '../admins/admins.module';
import { SuperAdminsModule } from '../super-admins/super-admins.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn =
          (configService.get<string>('JWT_EXPIRES_IN') || '1d') as StringValue;

        return {
          global: true,
          secret:
            configService.get<string>('JWT_SECRET') ||
            'dev-only-secret-change-in-production',
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
    UsersModule,
    AdminsModule,
    SuperAdminsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}