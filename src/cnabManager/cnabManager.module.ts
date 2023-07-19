import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/database/prisma.service';
import { CNABManagerController } from './cnabManager.controller';
import { CNABManagerService } from './cnabManager.service';
import { InternalFunctionsModule } from '../internalFunctions/internalFunctions.module';
import { AuthModule } from '../auth/auth.module';

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
  controllers: [CNABManagerController],
  providers: [CNABManagerService, PrismaService],
})
export class CNABManagerModule {}
