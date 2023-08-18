import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/database/prisma.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { UtilsModule } from 'src/utils/utils.module';
import { UpdatesService } from './updates.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    UtilsModule,
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
  controllers: [TasksController],
  providers: [TasksService, UpdatesService, PrismaService],
  exports: [TasksService, UpdatesService],
})
export class TasksModule {}
