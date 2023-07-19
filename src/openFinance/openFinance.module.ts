import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/database/prisma.service';
import { OpenFinanceController } from './openFinance.controller';
import { OpenFinanceService } from './openFinance.service';
import { InternalFunctionsModule } from '../internalFunctions/internalFunctions.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    AuthModule,
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
  controllers: [OpenFinanceController],
  providers: [OpenFinanceService, PrismaService],
  exports: [OpenFinanceService],
})
export class OpenFinanceModule {}
