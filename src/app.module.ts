import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { InfoModule } from './info/info.module';
import { TasksModule } from './cron/tasks.module';
import { CreditModule } from './credit/credit.module';
import { AdminModule } from './admin/admin.module';
import { PropostasCreditoModule } from './propostasCredito/propostasCredito.module';
import { OperacoesCreditoModule } from './operacoesCredito/operacoesCredito.module';
import { InternalFunctionsModule } from './internalFunctions/internalFunctions.module';
import { OpenFinanceModule } from './openFinance/openFinance.module';
import { CNABManagerModule } from './cnabManager/cnabManager.module';
// import { TransactionModule } from './transaction/transaction.module'
import { MulterModule } from '@nestjs/platform-express';
@Module({
  imports: [
    AuthModule,
    InfoModule,
    CreditModule,
    OpenFinanceModule,
    TasksModule,
    AdminModule,
    PropostasCreditoModule,
    OperacoesCreditoModule,
    CNABManagerModule,
    InternalFunctionsModule,
    MulterModule.register({
      dest: './uploads',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
