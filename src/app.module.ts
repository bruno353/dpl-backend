import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './tasks/tasks.module';
import { MulterModule } from '@nestjs/platform-express';
import { EventsHandlerModule } from './eventsHandler/events-handler.module';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [
    TasksModule,
    UtilsModule,
    EventsHandlerModule,
    MulterModule.register({
      dest: './uploads',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
