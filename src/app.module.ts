import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
// import { TransactionModule } from './transaction/transaction.module'
import { MulterModule } from '@nestjs/platform-express';
@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
