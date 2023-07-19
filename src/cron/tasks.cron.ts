import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { join, extname } from 'path';
import { FinanceService } from '../internalFunctions/finance.service';
import { PrismaService } from '../database/prisma.service';
import { addDays, startOfDay } from 'date-fns';
import { EmailSenderService } from '../internalFunctions/emailSender.service';

@Injectable()
export class TasksCron {
  private logger = new Logger(TasksCron.name);

  constructor(
    private readonly financeService: FinanceService,
    private readonly prisma: PrismaService,
    private readonly emailSenderService: EmailSenderService,
  ) {}

  @Cron('0 0 5 * *') //rodar todo dia 5 do mês, a meia noite.
  async handler() {
    const users = await this.prisma.usuario.findMany({});
    for (const user of users) {
      //1 - vendo se o user possui conexão com a NetSuite:
      const userNetsuite =
        await this.prisma.netsuiteCodatAPIConnection.findFirst({
          where: {
            usuarioId: user.id,
          },
        });
      if (userNetsuite) {
        try {
          this.financeService
            .getDataFromNetsuite(
              user.codatId,
              user.codatNetsuiteId,
              user.address,
              user.id,
            )
            .then(() => {
              console.log(
                `Task Success - netsuite atualizado com sucesso: ${user.id}`,
              );
              this.prisma.netsuiteCodatAPIConnection.update({
                where: {
                  usuarioId: user.id,
                },
                data: {
                  isUpdated: true,
                  updateTimestamp: String(Math.round(Date.now() / 1000)),
                },
              });
            });
        } catch (err) {
          console.log(`Task Error - netsuite não atualizado: ${user.id}`);
          console.log(err);
          this.prisma.netsuiteCodatAPIConnection.update({
            where: {
              usuarioId: user.id,
            },
            data: {
              isUpdated: false,
              updateTimestamp: String(Math.round(Date.now() / 1000)),
            },
          });
        }
      }

      //2 - vendo se o user possui conexão com a Conta Azul:
      const userContaAzul = await this.prisma.contaAzulAPIConnection.findFirst({
        where: {
          usuarioId: user.id,
        },
      });

      if (userContaAzul) {
        await this.prisma.contaAzulAPIConnection.update({
          where: {
            usuarioId: user.id,
          },
          data: {
            isUpdated: false,
            updateTimestamp: String(Math.round(Date.now() / 1000)),
          },
        });
      }

      //3 - vendo se o user possui conexão com a Omie:
      const userOmie = await this.prisma.omieAPIConnection.findFirst({
        where: {
          usuarioId: user.id,
        },
      });

      if (userOmie) {
        try {
          this.financeService
            .getDataFromOmie(userOmie.appKey, userOmie.appSecret, user.id)
            .then(() => {
              console.log(
                `Task Success - omie atualizado com sucesso: ${user.id}`,
              );
              this.prisma.omieAPIConnection.update({
                where: {
                  usuarioId: user.id,
                },
                data: {
                  isUpdated: true,
                  updateTimestamp: String(Math.round(Date.now() / 1000)),
                },
              });
            });
        } catch (err) {
          console.log(`Task Error - omie não atualizado: ${user.id}`);
          console.log(err);
          this.prisma.omieAPIConnection.update({
            where: {
              usuarioId: user.id,
            },
            data: {
              isUpdated: false,
              updateTimestamp: String(Math.round(Date.now() / 1000)),
            },
          });
        }
      }

      //4º verificação - Vindi:
      const userVindi = await this.prisma.vindiAPIConnection.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
      if (userVindi) {
        try {
          this.financeService
            .getDataFromVindi(userVindi.appPrivateKey, user.id)
            .then(() => {
              console.log(
                `Task Success - vindi atualizada com sucesso: ${user.id}`,
              );
              this.prisma.vindiAPIConnection.update({
                where: {
                  usuarioId: user.id,
                },
                data: {
                  isUpdated: true,
                  updateTimestamp: String(Math.round(Date.now() / 1000)),
                },
              });
            });
        } catch (err) {
          console.log(`Task Error - vindi não atualizada: ${user.id}`);
          console.log(err);
          await this.prisma.vindiAPIConnection.update({
            where: {
              usuarioId: user.id,
            },
            data: {
              isUpdated: false,
              updateTimestamp: String(Math.round(Date.now() / 1000)),
            },
          });
        }
      }

      //5º verificação - Pluggy:
      const userPluggy = await this.prisma.pluggyAPIConnection.findMany({
        where: {
          usuarioId: user.id,
        },
      });
      if (userPluggy.length > 0) {
        for (let i = 0; i < userPluggy.length; i++) {
          try {
            this.financeService
              .getDataFromPluggy(
                userPluggy[i].itemId,
                user.id,
                userPluggy[i].id,
              )
              .then(() => {
                console.log(
                  `Task Success - Pluggy atualizada com sucesso: ${user.id}`,
                );
                this.prisma.pluggyAPIConnection.update({
                  where: {
                    id: userPluggy[i].id,
                  },
                  data: {
                    isUpdated: true,
                    updateTimestamp: String(Math.round(Date.now() / 1000)),
                  },
                });
              });
          } catch (err) {
            console.log(`Task Error - Pluggy não atualizada: ${user.id}`);
            console.log(err);
            await this.prisma.pluggyAPIConnection.update({
              where: {
                id: userPluggy[i].id,
              },
              data: {
                isUpdated: false,
                updateTimestamp: String(Math.round(Date.now() / 1000)),
              },
            });
          }
        }
      }

      //6º verificação - Google Analytics:
      const userGoogleAnalytics =
        await this.prisma.googleAnalyticsAPIConnection.findFirst({
          where: {
            usuarioId: user.id,
          },
        });
      if (userGoogleAnalytics) {
        const projectId = 'healthy-rarity-380013';
        const keyFilename = join(
          __dirname,
          '../internalFunctions/credentials.json',
        );

        const analyticsDataClient = new BetaAnalyticsDataClient({
          projectId,
          keyFilename,
        });
        try {
          analyticsDataClient
            .runReport({
              property: `properties/${userGoogleAnalytics.appId}`,
              dateRanges: [
                {
                  startDate: '2010-03-31',
                  endDate: 'today',
                },
              ],
              dimensions: [
                {
                  name: 'city',
                },
              ],
              metrics: [
                {
                  name: 'activeUsers',
                },
              ],
            })
            .then(() => {
              console.log(
                `Task Success - Google Analytics atualizada com sucesso: ${user.id}`,
              );
              this.prisma.googleAnalyticsAPIConnection.update({
                where: {
                  usuarioId: user.id,
                },
                data: {
                  isUpdated: true,
                  updateTimestamp: String(Math.round(Date.now() / 1000)),
                },
              });
            });
        } catch (err) {
          console.log(
            `Task Error - Google Analytics não atualizado: ${user.id}`,
          );
          console.log(err);
          await this.prisma.googleAnalyticsAPIConnection.update({
            where: {
              usuarioId: user.id,
            },
            data: {
              isUpdated: false,
              updateTimestamp: String(Math.round(Date.now() / 1000)),
            },
          });
        }
      }
    }
  }

  @Cron('0 0 12 * * *') //rodar todo dia ao meio dia
  async handlerCobrancaEmail() {
    const today = startOfDay(new Date());
    const inFiveDays = addDays(today, 5);
    return;
    const operations = await this.prisma.operacoesCredito.findMany({
      where: {
        aberto: true,
        finalizada: false,
        pagamentos: {
          some: {
            dataVencimento: {
              gte: today,
              lte: inFiveDays,
            },
            pago: false,
          },
        },
      },
      include: {
        pagamentos: true,
      },
    });

    operations.forEach(async (operation) => {
      operation.pagamentos.forEach(async (payment) => {
        const diffInDays = Math.ceil(
          (payment.dataVencimento.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (diffInDays === 5) {
          await this.emailSenderService.emailCobranca5Dias(diffInDays);
          this.logger.log('Achei uma operação: ' + operation.id);
        }
      });
    });
  }
}
