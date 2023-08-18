import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'src/database/prisma.service';
import { EventsHandlerController } from './events-handler.controller';
import { EventsHandlerService } from './events-handler.service';
import { EventsGovernanceHandlerService } from './events-governance-handler.service';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from 'src/users/users.module';
import { UtilsModule } from 'src/utils/utils.module';
import { UpdatesService } from 'src/tasks/updates.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    UsersModule,
    UtilsModule,
    TasksModule,
    UpdatesService,
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
  providers: [
    EventsHandlerService,
    EventsGovernanceHandlerService,
    PrismaService,
  ],
  exports: [EventsHandlerService, EventsGovernanceHandlerService],
})
export class EventsHandlerModule {}
