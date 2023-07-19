import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/database/prisma.service';
import { TasksCron } from './tasks.cron';
import { InternalFunctionsModule } from '../internalFunctions/internalFunctions.module';

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
  providers: [TasksCron, PrismaService],
})
export class TasksModule {}
