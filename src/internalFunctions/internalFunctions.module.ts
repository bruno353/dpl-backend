import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/database/prisma.service';
import { FinanceService } from '../internalFunctions/finance.service';
import { GoogleSheetsService } from '../internalFunctions/googleSheets.service';
import { GoogleBucketService } from './googleBucket.service';
import { EmailSenderService } from './emailSender.service';
import { LogService } from './log.service';
import { AWSBucketService } from './awsBucket.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
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
  providers: [
    FinanceService,
    GoogleSheetsService,
    GoogleBucketService,
    EmailSenderService,
    PrismaService,
    LogService,
    AWSBucketService,
  ],
  exports: [
    FinanceService,
    GoogleSheetsService,
    GoogleBucketService,
    EmailSenderService,
    LogService,
    AWSBucketService,
  ],
})
export class InternalFunctionsModule {}
