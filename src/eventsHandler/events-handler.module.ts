import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/database/prisma.service';
import { EventsHandlerController } from './events-handler.controller';
import { EventsHandlerService } from './events-handler.service';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    UsersModule,
    TasksModule,
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
  controllers: [EventsHandlerController],
  providers: [EventsHandlerService, PrismaService],
  exports: [EventsHandlerService],
})
export class EventsHandlerModule {}
