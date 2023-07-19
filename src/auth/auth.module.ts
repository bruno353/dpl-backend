import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/database/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { InternalFunctionsModule } from '../internalFunctions/internalFunctions.module';
import { GoogleStrategy } from './utils/GoogleStrategy';
import { GoogleSheetsStrategy } from './utils/googleSheetsAuth/GoogleSheetsStrategy';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    InternalFunctionsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get('PRIVATE_ACCESS_KEY'),
          signOptions: { expiresIn: '2 days' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, GoogleStrategy, GoogleSheetsStrategy],
  exports: [AuthService],
})
export class AuthModule {}
