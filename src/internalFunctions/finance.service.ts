/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException } from '@nestjs/common';
import { Request, response } from 'express';
import { EventVerifier } from '@complycube/api';
import { ethers } from 'ethers';
import * as sgMail from '@sendgrid/mail';
import { SimpleCrypto } from 'simple-crypto-js';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import { PrismaService } from '../database/prisma.service';

import axios from 'axios';
import { GoogleSheetsService } from './googleSheets.service';
import { LogService } from '../internalFunctions/log.service';
import { KYBComplyCubeDTO } from 'src/auth/dto/kyb-comply-cube.dto';


@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly logService: LogService,
  ) {}
  simpleCryptoJs = new SimpleCrypto(process.env.CIPHER);

  usdcAddress = process.env.USDC_ADDRESS;

  kybComplyCubeAccessToken = process.env.KYB_COMPLY_CUBE_ACCESS_TOKEN;
  kybComplyCubeWebhookSecret = process.env.KYB_COMPLY_CUBE_WEBHOOK_SECRET;

  web3UrlProvider = process.env.WEB3_URL_PROVIDER;
  web3Provider = new ethers.providers.JsonRpcProvider(this.web3UrlProvider);

  viewPrivateKey =
    'a7ec59c41ec3608dece33851a7d805bf22cd33da3e22e438bfe033349eb04011';

  //chaves da pluggy
  clientId = process.env.CLIENT_ID;
  clientSecret = process.env.CLIENT_SECRET;

  //chaves da kyb big data:
  kybAccessToken = process.env.KYB_BIG_DATA_ACCESS_TOKEN;
  kybTokenId = process.env.KYB_BIG_DATA_TOKEN_ID;

  //**FUNÇÕES */

  public async getDataFromNetsuite(
    codatId: string,
    codatNetsuiteId: string,
    userAddress: string,
    usuarioId: string,
  ) {
    const objectNetsuite =
      await this.prisma.netsuiteCodatAPIConnection.findFirst({
        where: {
          usuarioId,
        },
      });

    const user = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
      },
    });

    const receitaTotal = {};
    const despesaTotal = {};
    const despesaVendasMarketing = {};
    const despesaSalarios = {};
    const despesaFinanceiraBancos = {};
    const despesaJurosSobreEmprestimos = {};
    const despesaPagamentoEmprestimos = {};
    const despesaImpostoTaxas = {};

    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;

    //OBTENDO DADOS DE FINANÇAS
    for (let i = 0; i < 24; i++) {
      if (currentMonth === 0) {
        currentYear--;
        currentMonth = 12;
      }
      let monthFormated = String(currentMonth);
      if (currentMonth >= 1 && currentMonth <= 9) {
        monthFormated = '0' + String(currentMonth);
      }
      // 2021-01-28T12:00:00
      const config = {
        method: 'get',
        url: `https://api.codat.io/data/companies/${codatId}/connections/${codatNetsuiteId}/assess/enhancedProfitAndLoss?reportDate=${currentYear}-${monthFormated}-28T12%3A00%3A00&periodLength=1&numberOfPeriods=1&includeDisplayNames=false`,
        headers: {
          accept: 'application/json',
          authorization: `Basic ${objectNetsuite.codatAPIKey}`,
        },
      };
      try {
        let dado;
        await axios(config).then(function (response) {
          dado = response.data.reportData['0'].components;
        });

        receitaTotal[String(currentYear) + '-' + String(monthFormated)] =
          dado['0'].measures['0'].value;
        despesaTotal[String(currentYear) + '-' + String(monthFormated)] =
          dado['1'].measures['0'].value;
        despesaVendasMarketing[
          String(currentYear) + '-' + String(monthFormated)
        ] = dado['1'].components['1'].components['0'].measures['0'].value;
        despesaSalarios[String(currentYear) + '-' + String(monthFormated)] =
          dado['1'].components['0'].components['1'].measures['0'].value;
        despesaFinanceiraBancos[
          String(currentYear) + '-' + String(monthFormated)
        ] = dado['1'].components['1'].components['9'].measures['0'].value;
        despesaJurosSobreEmprestimos[
          String(currentYear) + '-' + String(monthFormated)
        ] = dado['1'].components['1'].components['11'].measures['0'].value;
        despesaPagamentoEmprestimos[
          String(currentYear) + '-' + String(monthFormated)
        ] = dado['1'].components['1'].components['10'].measures['0'].value;
        despesaImpostoTaxas[String(currentYear) + '-' + String(monthFormated)] =
          dado['1'].components['2'].components['0'].measures['0'].value;
      } catch (err) {
        console.log(err);
      }
      currentMonth--;
    }

    await this.prisma.netsuiteCodatAPIConnection.update({
      where: {
        usuarioId,
      },
      data: {
        receitaTotal: JSON.stringify(receitaTotal),
        despesaTotal: JSON.stringify(despesaTotal),
        updateTimestamp: String(Math.round(Date.now() / 1000)),
        despesaVendasMarketing: JSON.stringify(despesaVendasMarketing),
        despesaSalarios: JSON.stringify(despesaSalarios),
        despesaFinanceiraBancos: JSON.stringify(despesaFinanceiraBancos),
        despesaJurosSobreEmprestimos: JSON.stringify(
          despesaJurosSobreEmprestimos,
        ),
        despesaPagamentoEmprestimos: JSON.stringify(
          despesaPagamentoEmprestimos,
        ),
        despesaImpostoTaxas: JSON.stringify(despesaImpostoTaxas),
        isUpdated: true,
      },
    });

    //subscrevendo os dados no excel:
    const dataAtual = new Date(); // cria uma nova data com a data e hora atuais
    const dia = dataAtual.getDate().toString().padStart(2, '0'); // obtém o dia e adiciona um zero à esquerda, se necessário
    const mes = (dataAtual.getMonth() + 1).toString().padStart(2, '0'); // obtém o mês (0 = janeiro, 1 = fevereiro, etc.) e adiciona um zero à esquerda, se necessário
    const ano = dataAtual.getFullYear(); // obtém o ano com quatro dígitos
    const dataAtualFormatada = `${dia}/${mes}/${ano}`;

    //data criada em:
    const dataCriadoEm = objectNetsuite.criadoEm;
    const dataCriadoEmData = new Date(dataCriadoEm);

    const diaCriadoEm = dataCriadoEmData.getDate().toString().padStart(2, '0');
    const mesCriadoEm = (dataCriadoEmData.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const anoCriadoEm = dataCriadoEmData.getFullYear().toString();

    const dataCriadoEmFormatada = `${diaCriadoEm}/${mesCriadoEm}/${anoCriadoEm}`;

    const finalValuesArray = [];
    for (const key in receitaTotal) {
      const value = [
        objectNetsuite.id,
        user.nomeEmpresa,
        key,
        JSON.stringify(receitaTotal[key]),
        JSON.stringify(despesaTotal[key]),
        JSON.stringify(despesaVendasMarketing[key]),
        JSON.stringify(despesaSalarios[key]),
        JSON.stringify(despesaFinanceiraBancos[key]),
        JSON.stringify(despesaJurosSobreEmprestimos[key]),
        JSON.stringify(despesaPagamentoEmprestimos[key]),
        JSON.stringify(despesaImpostoTaxas[key]),
        dataAtualFormatada,
        dataCriadoEmFormatada,
      ];
      finalValuesArray.push(value);
    }
    const arrayHeaders = [
      'StartupId',
      'Startup',
      'Data',
      'receitaTotal',
      'despesaTotal',
      'despesaVendasMarketing',
      'despesaSalarios',
      'despesaFinanceiraBancos',
      'despesaJurosSobreEmprestimos',
      'despesaPagamentoEmprestimos',
      'despesaImpostoTaxas',
      'atualizadoEm',
      'criadoEm',
    ];
    finalValuesArray.unshift(arrayHeaders);
    await this.googleSheetsService.writeSheet(
      usuarioId,
      finalValuesArray,
      'netsuite',
    );
  }

  //Esta função serve para pegar os dados da Conta Azul do cliente, passando o sessiontoken e refresh token para essa função.
  //necessários para se obter os dados.
  public async getDataFromContaAzul(accessToken: string, usuarioId: string) {
    console.log('fui chamado para realizar o dataFromContaAzul');
    const userContaAzul = await this.prisma.contaAzulAPIConnection.findFirst({
      where: {
        usuarioId: usuarioId,
      },
    });
    const user = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
      },
    });
    const finalList = userContaAzul.data;
    console.log('passei por aqui');

    let usersAvailable = JSON.parse(userContaAzul.usersAvailablePerMonth);

    if (!usersAvailable) {
      usersAvailable = {}
    }

    let counter = 0;
    let totalRevenue = 0;
    const dates = [];
    const revenuePerMonth = {};
    const userCounterPerMonth = {}; //um contador auxiliar (para calcular ARPU) para garantir que se um user fizer duas compras no mês ele não seja contabilizado como 2 users.
    const unPaidSubscriptionsPerMonth = {};
    const totalMonths = [];
    const revenuePerYear = {};

    const yearNow = new Date().getFullYear();
    const pastYear = Number(yearNow) - 1;
    let totalRevenuePastYear = new Decimal(0);
    let totalRevenueThisYear = new Decimal(0);

    // **calculando anual e mensal revenue** :
    while (true) {
      const config = {
        method: 'get',
        url: `https://api.contaazul.com/v1/sales?page=${counter}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: 'application/json',
        },
      };

      let dado;
      try {
        await axios(config).then(function (response) {
          dado = response.data;
          console.log('o dado que recebi!')
          console.log(dado)
        });
      } catch (err) {
        this.logService.createErrorLog(
          'getDataFromContaAzul',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(config),
          `erro em https://api.contaazul.com/v1/sales?page=${counter}`,
          user.id,
        );
        console.log(err);
        return;
      }
      console.log('passei por aqui');

      if (dado.length === 0) break;
      for (let i = 0; i < dado.length; i++) {
        finalList.push(dado[i]);
        if (dado[i].status === 'COMMITTED') {
          totalRevenue =
            totalRevenue + Number(dado[i].payment.installments[0].value);
          const month = dado[i].emission.substring(0, 7);
          const year = dado[i].emission.substring(0, 4);
          if (!revenuePerYear[year]) revenuePerYear[year] = '0';
          if (!revenuePerMonth[month]) revenuePerMonth[month] = '0';
          if (!userCounterPerMonth[month]) userCounterPerMonth[month] = [];
          if (new Decimal(year).equals(new Decimal(pastYear)))
            totalRevenuePastYear = new Decimal(totalRevenuePastYear).plus(
              new Decimal(dado[i].payment.installments[0].value),
            );

          if (new Decimal(year).equals(new Decimal(yearNow)))
            totalRevenueThisYear = new Decimal(totalRevenueThisYear).plus(
              dado[i].payment.installments[0].value,
            );

          if (!userCounterPerMonth[month].includes(dado[i].customer.id))
            userCounterPerMonth[month].push(dado[i].customer.id);

          revenuePerMonth[month] = String(
            new Decimal(revenuePerMonth[month]).plus(
              new Decimal(dado[i].payment.installments[0].value),
            ),
          );
          revenuePerYear[year] = String(
            new Decimal(revenuePerYear[year]).plus(
              new Decimal(dado[i].payment.installments[0].value),
            ),
          );
          let timestamp = new Date(dado[i].emission).getTime();
          timestamp = Math.round(timestamp / 1000);
          dates.push(timestamp);
        } else {
          const month = dado[i].emission.substring(0, 7);
          if (!unPaidSubscriptionsPerMonth[month])
            unPaidSubscriptionsPerMonth[month] = '0';
          unPaidSubscriptionsPerMonth[month] = String(
            new Decimal(unPaidSubscriptionsPerMonth[month]).plus(
              new Decimal(dado[i].payment.installments[0].value),
            ),
          );
        }
        const totalMonthsMonth = dado[i].emission.substring(0, 7);
        if (!totalMonths.includes(totalMonthsMonth)) {
          totalMonths.push(totalMonthsMonth);
        }
      }
      counter++;
    }
    const ARPU = {};
    console.log('passei por aqui f');

    //pegando o ARPU:
    for (const key in revenuePerMonth) {
      ARPU[key] = Number(
        new Decimal(revenuePerMonth[key]).div(
          new Decimal(userCounterPerMonth[key].length),
        ),
      );
    }
    console.log('passei por aqui g');

    const unPaidMRR = {}; //porcentagem

    //pegando o unPaid MRR:
    // for (let i = 0; i < totalMonths.length; i++) {
    //   // eslint-disable-next-line prettier/prettier
    //   unPaidMRR[totalMonths[i]] =
    //     // eslint-disable-next-line prettier/prettier
    //     Number(new Decimal(unPaidSubscriptionsPerMonth[totalMonths[i]]).div((new Decimal(revenuePerMonth[totalMonths[i]]).plus(new Decimal(unPaidSubscriptionsPerMonth[totalMonths[i]])))));
    // }
    console.log('passei por aqui 2');

    //transformando os dates:
    let firstTimestamp = Math.min(...dates);
    let finalTimestamp = Math.max(...dates);

    if (!firstTimestamp) {
      firstTimestamp = dates[0];
    }
    if (!finalTimestamp) {
      finalTimestamp = dates[0];
    }
    console.log('passei por aqui g3');

    // eslint-disable-next-line prettier/prettier
    const mensalRevenue =
      Number((new Decimal(2592000).times(new Decimal(totalRevenue))).div(new Decimal(finalTimestamp).sub(firstTimestamp)));

    // eslint-disable-next-line prettier/prettier
    const anualRevenue =
      Number(new Decimal(31536000).times(new Decimal(totalRevenue)).div(new Decimal(finalTimestamp).sub(firstTimestamp)));

    // eslint-disable-next-line prettier/prettier
    const ARRGrowthYoY =
      Number(new Decimal(totalRevenueThisYear).sub(new Decimal(totalRevenuePastYear)).div(totalRevenuePastYear));
      console.log('passei por aqui g5');

    // **calculando churn** :

    let counter2 = 0;
    let totalAmountEnabledClients = 0;
    let totalAmountDisabledClients = 0;
    //calculando o número total de clientes ativos
    while (true) {
      const config = {
        method: 'get',
        url: `https://api.contaazul.com/v1/customers?page=${counter2}&status=ENABLED`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: 'application/json',
        },
      };

      let dado;
      try {
        await axios(config).then(function (response) {
          dado = response.data;
        });
      } catch (err) {
        this.logService.createErrorLog(
          'getDataFromContaAzul',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(config),
          `erro em https://api.contaazul.com/v1/customers?page=${counter2}&status=ENABLED`,
          user.id,
        );
        console.log(err);
        return;
      }
      if (dado.length === 0) break;
      totalAmountEnabledClients = dado.length;
      counter2++;
    }
    console.log('passei por aqui gaa');

    counter2 = 0;
    //calculando o número total de clientes ativos:
    while (true) {
      const config = {
        method: 'get',
        url: `https://api.contaazul.com/v1/customers?page=${counter2}&status=DISABLED`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: 'application/json',
        },
      };

      let dado;
      try {
        await axios(config).then(function (response) {
          dado = response.data;
          console.log(response.data);
        });
      } catch (err) {
        this.logService.createErrorLog(
          'getDataFromContaAzul',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(config),
          `erro em https://api.contaazul.com/v1/customers?page=${counter2}&status=DISABLED`,
          user.id,
        );
        console.log(err);
        return;
      }
      if (dado.length === 0) break;
      totalAmountDisabledClients = dado.length;
      counter2++;
    }

    const totalClients = totalAmountDisabledClients + totalAmountEnabledClients;
    const churn = totalAmountDisabledClients / totalClients;

    const dateChurn = new Date();

    const yearChurn = dateChurn.getFullYear();

    let monthChurn: any = dateChurn.getMonth() + 1;
    monthChurn = (monthChurn < 10 ? '0' : '') + monthChurn;
    const result = yearChurn + '-' + monthChurn;
    usersAvailable[result] = totalAmountEnabledClients;

    console.log('passei por aqui a')
    await this.prisma.contaAzulAPIConnection.update({
      where: {
        usuarioId,
      },
      data: {
        data: JSON.stringify(finalList),
        updateTimestamp: String(Math.round(Date.now() / 1000)),
        receitaTotal: JSON.stringify(totalRevenue),
        totalTimestamp: String(finalTimestamp - firstTimestamp),
        receitaMensal: JSON.stringify(mensalRevenue),
        receitaPorMes: JSON.stringify(revenuePerMonth),
        receitaPorAno: JSON.stringify(revenuePerYear),
        receitaAnual: JSON.stringify(anualRevenue),
        usersAvailablePerMonth: JSON.stringify(usersAvailable),
        activeSubscriptions: JSON.stringify(totalAmountEnabledClients),
        churn: JSON.stringify(churn),
        ARPU: JSON.stringify(ARPU),
        unPaidMRR: JSON.stringify(unPaidMRR),
        ARRGrowthYoY: JSON.stringify(ARRGrowthYoY),
        isUpdated: true,
      },
    });
    console.log('passei por aqui q')
    //subscrevendo os dados no excel:
    const dataAtual = new Date(); // cria uma nova data com a data e hora atuais
    const dia = dataAtual.getDate().toString().padStart(2, '0'); // obtém o dia e adiciona um zero à esquerda, se necessário
    const mes = (dataAtual.getMonth() + 1).toString().padStart(2, '0'); // obtém o mês (0 = janeiro, 1 = fevereiro, etc.) e adiciona um zero à esquerda, se necessário
    const ano = dataAtual.getFullYear(); // obtém o ano com quatro dígitos
    const dataAtualFormatada = `${dia}/${mes}/${ano}`;

    //data criada em:
    const dataCriadoEm = userContaAzul.criadoEm;
    const dataCriadoEmData = new Date(dataCriadoEm);

    const diaCriadoEm = dataCriadoEmData.getDate().toString().padStart(2, '0');
    const mesCriadoEm = (dataCriadoEmData.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const anoCriadoEm = dataCriadoEmData.getFullYear().toString();

    const dataCriadoEmFormatada = `${diaCriadoEm}/${mesCriadoEm}/${anoCriadoEm}`;

    const finalValuesArray = [];
    for (const key in revenuePerMonth) {
      const value = [
        userContaAzul.id,
        user.nomeEmpresa,
        key,
        JSON.stringify(unPaidMRR[key]),
        JSON.stringify(usersAvailable[key]),
        JSON.stringify(churn[key]),
        JSON.stringify(ARPU[key]),
        JSON.stringify(ARRGrowthYoY[key]),
        JSON.stringify(totalAmountEnabledClients[key]),
        JSON.stringify(revenuePerYear[key]),
        JSON.stringify(revenuePerMonth[key]),
        dataAtualFormatada,
        dataCriadoEmFormatada,
      ];
      finalValuesArray.push(value);
    }
    const arrayHeaders = [
      'StartupId',
      'Startup',
      'Data',
      'unPaidMRR',
      'usuarios ativos',
      'churn',
      'ARPU',
      'ARRGrowthYoY',
      'totalAmountEnabledClients',
      'receitaPorAno',
      'receitaPorMes',
      'atualizadoEm',
      'criadoEm',
    ];
    finalValuesArray.unshift(arrayHeaders);

    await this.googleSheetsService.writeSheet(
      usuarioId,
      finalValuesArray,
      'contaAzul',
    );
  }

  public async getDataFromOmie(
    appKey: string,
    appSecret: string,
    usuarioId: string,
  ) {
    const userOmie = await this.prisma.omieAPIConnection.findFirst({
      where: {
        usuarioId: usuarioId,
      },
    });

    console.log('iniciado conexao omie');

    const user = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
      },
    });
    const receitaTotal = {};
    const receitaServicoPrestado = {};
    const receitaEmprestimosBancarios = {};
    const receitaVendaAtivos = {};
    const despesaTotal = {};
    const despesaVendasMarketing = {};
    const despesaComissoes = {};
    const despesaCompraDeServicos = {};
    const despesaSalarios = {};
    const despesaFinanceiraBancos = {};
    const despesaJurosSobreEmprestimos = {};
    const despesaPagamentoEmprestimos = {};
    const despesaImpostoTaxas = {};
    const despesaInvestimentos = {};
    const despesaDevolucaoVendas = {};

    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;

    //OBTENDO DADOS DE FINANÇAS
    for (let i = 0; i < 24; i++) {
      if (currentMonth === 0) {
        currentYear--;
        currentMonth = 12;
      }
      let monthFormated = String(currentMonth);
      if (currentMonth >= 1 && currentMonth <= 9) {
        monthFormated = '0' + String(currentMonth);
      }

      const body = {
        call: 'ListarOrcamentos',
        app_key: appKey,
        app_secret: appSecret,
        param: [{ nAno: currentYear, nMes: currentMonth }],
      };
      const config = {
        method: 'post',
        url: `https://app.omie.com.br/api/v1/financas/caixa/`,
        headers: {
          accept: 'application/json',
        },
        data: body,
      };
      let dado;
      try {
        await axios(config).then(function (response) {
          dado = response.data;
        });
      } catch (err) {
        this.logService.createErrorLog(
          'getDataFromOmie',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(config),
          undefined,
          user.id,
        );
        console.log(err);
        throw new BadRequestException('Omie', {
          cause: new Error(),
          description: err,
        });
      }

      console.log('linkando dados');
      receitaTotal[String(currentYear) + '-' + String(monthFormated)] =
        dado.ListaOrcamentos[0].nValorRealilzado;
      receitaServicoPrestado[
        String(currentYear) + '-' + String(monthFormated)
      ] = dado.ListaOrcamentos[3].nValorRealilzado;
      receitaEmprestimosBancarios[
        String(currentYear) + '-' + String(monthFormated)
      ] = dado.ListaOrcamentos[17].nValorRealilzado;
      receitaVendaAtivos[String(currentYear) + '-' + String(monthFormated)] =
        dado.ListaOrcamentos[18].nValorRealilzado;
      despesaTotal[String(currentYear) + '-' + String(monthFormated)] =
        dado.ListaOrcamentos[19].nValorRealilzado;
      despesaCompraDeServicos[
        String(currentYear) + '-' + String(monthFormated)
      ] = dado.ListaOrcamentos[24].nValorRealilzado;
      despesaVendasMarketing[
        String(currentYear) + '-' + String(monthFormated)
      ] = dado.ListaOrcamentos[25].nValorRealilzado;
      despesaComissoes[String(currentYear) + '-' + String(monthFormated)] =
        dado.ListaOrcamentos[26].nValorRealilzado;
      despesaSalarios[String(currentYear) + '-' + String(monthFormated)] =
        dado.ListaOrcamentos[31].nValorRealilzado;
      despesaFinanceiraBancos[
        String(currentYear) + '-' + String(monthFormated)
      ] = dado.ListaOrcamentos[59].nValorRealilzado;
      despesaJurosSobreEmprestimos[
        String(currentYear) + '-' + String(monthFormated)
      ] = dado.ListaOrcamentos[60].nValorRealilzado;
      despesaPagamentoEmprestimos[
        String(currentYear) + '-' + String(monthFormated)
      ] = dado.ListaOrcamentos[62].nValorRealilzado;
      despesaImpostoTaxas[String(currentYear) + '-' + String(monthFormated)] =
        dado.ListaOrcamentos[64].nValorRealilzado;
      despesaInvestimentos[String(currentYear) + '-' + String(monthFormated)] =
        dado.ListaOrcamentos[74].nValorRealilzado;
      despesaDevolucaoVendas[
        String(currentYear) + '-' + String(monthFormated)
      ] = dado.ListaOrcamentos[83].nValorRealilzado;

      currentMonth--;
    }



    //OBTENDO DADOS DE DRE
    const body2 = {
      call: 'ListarCadastroDRE',
      app_key: appKey,
      app_secret: appSecret,
      param: [{ apenasContasAtivas: 'N' }],
    };
    const config2 = {
      method: 'post',
      url: `https://app.omie.com.br/api/v1/geral/dre/`,
      headers: {
        accept: 'application/json',
      },
      data: body2,
    };

    let dado2;
    try {
      await axios(config2).then(function (response) {
        dado2 = response.data.dreLista;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'getDataFromOmie',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(config2),
        undefined,
        user.id,
      );
      console.log(err);
    }

    await this.prisma.omieAPIConnection.update({
      where: {
        usuarioId,
      },
      data: {
        updateTimestamp: String(Math.round(Date.now() / 1000)),
        receitaTotal: JSON.stringify(receitaTotal),
        receitaServicoPrestado: JSON.stringify(receitaServicoPrestado),
        // eslint-disable-next-line prettier/prettier
        receitaEmprestimosBancarios: JSON.stringify(receitaEmprestimosBancarios),
        receitaVendaAtivos: JSON.stringify(receitaVendaAtivos),
        despesaTotal: JSON.stringify(despesaTotal),
        despesaVendasMarketing: JSON.stringify(despesaVendasMarketing),
        despesaComissoes: JSON.stringify(despesaComissoes),
        despesaCompraDeServicos: JSON.stringify(despesaCompraDeServicos),
        despesaSalarios: JSON.stringify(despesaSalarios),
        despesaFinanceiraBancos: JSON.stringify(despesaFinanceiraBancos),
        // eslint-disable-next-line prettier/prettier
        despesaJurosSobreEmprestimos: JSON.stringify(despesaJurosSobreEmprestimos),
        // eslint-disable-next-line prettier/prettier
        despesaPagamentoEmprestimos: JSON.stringify(despesaPagamentoEmprestimos),
        despesaImpostoTaxas: JSON.stringify(despesaImpostoTaxas),
        despesaInvestimentos: JSON.stringify(despesaInvestimentos),
        despesaDevolucaoVendas: JSON.stringify(despesaDevolucaoVendas),
        DRE: JSON.stringify(dado2),
        isUpdated: true,
      },
    });

    //subscrevendo os dados no excel:
    const dataAtual = new Date(); // cria uma nova data com a data e hora atuais
    const dia = dataAtual.getDate().toString().padStart(2, '0'); // obtém o dia e adiciona um zero à esquerda, se necessário
    const mes = (dataAtual.getMonth() + 1).toString().padStart(2, '0'); // obtém o mês (0 = janeiro, 1 = fevereiro, etc.) e adiciona um zero à esquerda, se necessário
    const ano = dataAtual.getFullYear(); // obtém o ano com quatro dígitos
    const dataAtualFormatada = `${dia}/${mes}/${ano}`;

    //data criada em:
    const dataCriadoEm = userOmie.criadoEm;
    const dataCriadoEmData = new Date(dataCriadoEm);

    const diaCriadoEm = dataCriadoEmData.getDate().toString().padStart(2, '0');
    const mesCriadoEm = (dataCriadoEmData.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const anoCriadoEm = dataCriadoEmData.getFullYear().toString();

    const dataCriadoEmFormatada = `${diaCriadoEm}/${mesCriadoEm}/${anoCriadoEm}`;
    console.log('preparando array para o sheets');

    const finalValuesArray = [];
    for (const key in receitaTotal) {
      const value = [
        userOmie.id,
        user.nomeEmpresa,
        key,
        JSON.stringify(receitaTotal[key]),
        JSON.stringify(receitaEmprestimosBancarios[key]),
        JSON.stringify(receitaServicoPrestado[key]),
        JSON.stringify(receitaVendaAtivos[key]),
        JSON.stringify(despesaTotal[key]),
        JSON.stringify(despesaComissoes[key]),
        JSON.stringify(despesaJurosSobreEmprestimos[key]),
        JSON.stringify(despesaInvestimentos[key]),
        JSON.stringify(despesaImpostoTaxas[key]),
        JSON.stringify(despesaCompraDeServicos[key]),
        JSON.stringify(despesaFinanceiraBancos[key]),
        JSON.stringify(despesaDevolucaoVendas[key]),
        JSON.stringify(despesaSalarios[key]),
        JSON.stringify(despesaPagamentoEmprestimos[key]),
        JSON.stringify(despesaVendasMarketing[key]),
        JSON.stringify(dado2),
        '-',
        '-',
        '-',
        dataAtualFormatada,
        dataCriadoEmFormatada,
      ];
      finalValuesArray.push(value);
    }
    const arrayHeaders = [
      'StartupId',
      'Startup',
      'Data',
      'receitaTotal',
      'receitaEmprestimosBancarios',
      'receitaServicoPrestado',
      'receitaVendaAtivos',
      'despesaTotal',
      'despesaComissoes',
      'despesaJurosSobreEmprestimos',
      'despesaInvestimentos',
      'despesaImpostoTaxas',
      'despesaCompraDeServicos',
      'despesaFinanceiraBancos',
      'despesaDevolucaoVendas',
      'despesaSalarios',
      'despesaPagamentoEmprestimos',
      'despesaVendasMarketing',
      'DRE',
      'clientes',
      'numeroClientesAtivos',
      'numeroClientesInativos',
      'atualizadoEm',
      'criadoEm',
    ];
    finalValuesArray.unshift(arrayHeaders);
    console.log('preparando array para o sheets');
    this.googleSheetsService.writeSheet(usuarioId, finalValuesArray, 'omie');
    this.getClientesOmie(appKey, appSecret, usuarioId, finalValuesArray);
    return;
  }

  //função de suporte para pegar os dados da omie:
  async getClientesOmie(
    appKey: string,
    appSecret: string,
    usuarioId: string,
    finalValuesArray: Array<any>,
  ) {
    try {
      const userOmie = await this.prisma.omieAPIConnection.findFirst({
        where: {
          usuarioId: usuarioId,
        },
      });
      await this.prisma.usuario.findFirst({
        where: {
          id: usuarioId,
        },
      });
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      let numeroClientesAtivos = 0;
      let numeroClientesInativos = 0;

      //OBTENDO INFO CLIENTES - GERAL:
      let clientes: any = JSON.parse(userOmie.clientes);
      const numeroClientesAtivosPorMes: any = JSON.parse(
        userOmie.numeroClientesAtivosPorMes,
      );
      const numeroClientesInativosPorMes: any = JSON.parse(
        userOmie.numeroClientesInativosPorMes,
      );
      if (!clientes) {
        clientes = {};
      }

      const finalList = [];
      let counter = 1;
      while (true) {
        const body = {
          call: 'ListarClientes',
          app_key: appKey,
          app_secret: appSecret,
          param: [
            {
              pagina: counter,
              registros_por_pagina: 100,
              apenas_importado_api: 'N',
            },
          ],
        };
        const config = {
          method: 'post',
          url: `https://app.omie.com.br/api/v1/geral/clientes/`,
          headers: {
            accept: 'application/json',
          },
          data: body,
        };
        let dado;
        try {
          await axios(config).then(function (response) {
            dado = response.data;
          });
        } catch (err) {
          this.logService.createErrorLog(
            'getClientesOmie',
            JSON.stringify(err),
            JSON.stringify(err['response']['data']),
            JSON.stringify(config),
            undefined,
            usuarioId,
          );
          console.log(err);
          break;
        }
        console.log(dado['clientes_cadastro'].length + ' a length do dado');
        if (dado['clientes_cadastro'].length === 0) break;
        const arrayClientes = dado['clientes_cadastro'];
        for (let i = 0; i < 3; i++) {
          console.log('chamado feito');
          const cliente = {};
          cliente['estado'] = arrayClientes[i].estado;
          cliente['CNPJ_CPF'] = arrayClientes[i].cnpj_cpf;
          cliente['inativo'] = arrayClientes[i].inativo;
          if (arrayClientes[i].inativo === 'N') {
            numeroClientesAtivos++;
          } else {
            numeroClientesInativos++;
          }
          finalList.push(cliente);
        }
        counter++;
        console.log(process.memoryUsage());
        console.log('chamado feito2');
      }
      console.log('passei por aqui1');
      const monthClientes = (currentMonth < 10 ? '0' : '') + currentMonth;
      const dateFormatedClientes = currentYear + '-' + monthClientes;
      console.log(dateFormatedClientes);
      console.log(clientes);
      console.log('clientes final lis');
      console.log(finalList);

      clientes[dateFormatedClientes] = finalList;
      numeroClientesInativosPorMes[dateFormatedClientes] =
        numeroClientesInativos;
      numeroClientesAtivosPorMes[dateFormatedClientes] = numeroClientesAtivos;

      const ARPU = {};
      try {
        //pegando o ARPU:
        for (const key in JSON.parse(userOmie.receitaTotal)) {
          ARPU[key] = Number(
            new Decimal(JSON.parse(userOmie.receitaTotal[key])).div(
              new Decimal(numeroClientesAtivosPorMes[key]),
            ),
          );
        }
      } catch (err) {
        console.log('erro aqui na contagem do ARPU omie')
        console.log(err);
      }

      console.log('passei por aqui2');
      console.log('plotaqndo os cliente');
      console.log(clientes);
      await this.prisma.omieAPIConnection.update({
        where: {
          usuarioId,
        },
        data: {
          clientes: JSON.stringify(clientes),
          // eslint-disable-next-line prettier/prettier
          numeroClientesAtivosPorMes: JSON.stringify(numeroClientesAtivosPorMes),
          ARPU: JSON.stringify(ARPU),
          // eslint-disable-next-line prettier/prettier
          numeroClientesInativosPorMes: JSON.stringify(numeroClientesInativosPorMes)
        },
      });
      console.log('passei por aqui3');
      //subscrevendo o dado no googleSheets:
      for (let i = 0; i < finalValuesArray.length; i++) {
        if (clientes[finalValuesArray[i][2]]) {
          finalValuesArray[i][19] = JSON.stringify(
            clientes[finalValuesArray[i][2]],
          );
          finalValuesArray[i][20] = JSON.stringify(
            numeroClientesAtivosPorMes[finalValuesArray[i][2]],
          );
          finalValuesArray[i][21] = JSON.stringify(
            numeroClientesInativosPorMes[finalValuesArray[i][2]],
          );
        }
      }
      await this.googleSheetsService.writeSheet(
        usuarioId,
        finalValuesArray,
        'omie',
      );
    } catch (err) {
      console.log('um erro gravíssimo ocorreu - getClientes Omie');
      await this.googleSheetsService.writeSheet(
        usuarioId,
        finalValuesArray,
        'omie',
      );
      console.log(err);
    }
  }

  //Esta função serve para pegar os dados da Vindi do cliente, passando a apikey essa função.
  public async getDataFromVindi(accessToken, usuarioId) {
    const finalList = [];

    let counter = 1;
    let totalRevenue = 0;
    const dates = [];
    const revenuePerMonth = {};
    const unPaidSubscriptionsPerMonth = {};
    const totalMonths = [];
    const revenuePerYear = {};
    const userCounterPerMonth = {}; //um contador auxiliar (para calcular ARPU) para garantir que se um user fizer duas compras no mês ele não seja contabilizado como 2 users.

    const yearNow = new Date().getFullYear();
    const pastYear = Number(yearNow) - 1;
    let totalRevenuePastYear = 0;
    let totalRevenueThisYear = 0;

    // **calculando anual e mensal revenue** :
    while (true) {
      const config = {
        method: 'get',
        url: `https://app.vindi.com.br/api/v1/bills?page=${counter}&per_page=25&sort_by=created_at&sort_order=asc`,
        headers: {
          accept: 'application/json',
        },
        auth: {
          username: `${accessToken}`,
          password: '',
        },
      };
      let dado;
      try {
        await axios(config).then(function (response) {
          dado = response.data.bills;
        });
      } catch (err) {
        this.logService.createErrorLog(
          'getDataFromVindi',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(config),
          undefined,
          usuarioId,
        );
        console.log(err);
        throw new BadRequestException('Vindi', {
          cause: new Error(),
          description: err,
        });
      }

      if (dado.length === 0) break;
      for (let i = 0; i < dado.length; i++) {
        finalList.push(dado[i]);
        if (dado[i].status === 'paid') {
          totalRevenue = totalRevenue + Number(dado[i].amount);
          const month = dado[i].charges[0].paid_at.substring(0, 7);
          const year = dado[i].charges[0].paid_at.substring(0, 4);
          if (!revenuePerYear[year]) revenuePerYear[year] = '0';
          if (!revenuePerMonth[month]) revenuePerMonth[month] = '0';
          if (!userCounterPerMonth[month]) userCounterPerMonth[month] = [];
          if (Number(year) === Number(pastYear))
            totalRevenuePastYear =
              // eslint-disable-next-line prettier/prettier
              Number(new Decimal(totalRevenuePastYear).plus(new Decimal(dado[i].amount)));
          if (Number(year) === Number(yearNow))
            totalRevenueThisYear =
              // eslint-disable-next-line prettier/prettier
              Number(new Decimal(totalRevenueThisYear).plus(new Decimal(dado[i].amount)));
          if (!userCounterPerMonth[month].includes(dado[i].customer.id))
            userCounterPerMonth[month].push(dado[i].customer.id);
          revenuePerMonth[month] = String(
            new Decimal(revenuePerMonth[month]).plus(
              new Decimal(dado[i].amount),
            ),
          );
          revenuePerYear[year] = String(
            new Decimal(revenuePerYear[year]).plus(new Decimal(dado[i].amount)),
          );
          let timestamp = new Date(dado[i].charges[0].paid_at).getTime();
          timestamp = Math.round(timestamp / 1000);
          dates.push(timestamp);
        } else {
          const month = dado[i].charges[0].paid_at.substring(0, 7);
          if (!unPaidSubscriptionsPerMonth[month])
            unPaidSubscriptionsPerMonth[month] = '0';
          unPaidSubscriptionsPerMonth[month] = String(
            new Decimal(unPaidSubscriptionsPerMonth[month]).plus(
              new Decimal(dado[i].amount),
            ),
          );
        }
        const totalMonthsMonth = dado[i].charges[0].paid_at.substring(0, 7);
        if (!totalMonths.includes(totalMonthsMonth)) {
          totalMonths.push(totalMonthsMonth);
        }
      }
      counter++;
    }

    const ARPU = {};

    //pegando o ARPU:
    for (const key in revenuePerMonth) {
      ARPU[key] = Number(
        new Decimal(revenuePerMonth[key]).div(
          new Decimal(userCounterPerMonth[key].length),
        ),
      );
    }

    const unPaidMRR = {}; //porcentagem

    for (let i = 0; i < totalMonths.length; i++) {
      // eslint-disable-next-line prettier/prettier
      unPaidMRR[totalMonths[i]] = Number(new Decimal(unPaidSubscriptionsPerMonth[totalMonths[i]]).div((new Decimal(revenuePerMonth[totalMonths[i]]).plus(new Decimal (unPaidSubscriptionsPerMonth[totalMonths[i]])))));
    }

    //transformando os dates:
    let firstTimestamp = Math.min(...dates);
    let finalTimestamp = Math.max(...dates);

    if (!firstTimestamp) {
      firstTimestamp = dates[0];
    }
    if (!finalTimestamp) {
      finalTimestamp = dates[0];
    }

    // eslint-disable-next-line prettier/prettier
    const mensalRevenue =
      Number(new Decimal(2592000).times(new Decimal(totalRevenue)).div(new Decimal(finalTimestamp).sub(new Decimal(firstTimestamp))));

    // eslint-disable-next-line prettier/prettier
    const anualRevenue =
      Number(new Decimal(31536000).times(new Decimal(totalRevenue)).div(new Decimal(finalTimestamp).sub(new Decimal(firstTimestamp))));


    const ARRGrowthYoY =
      // eslint-disable-next-line prettier/prettier
      Number((new Decimal(totalRevenueThisYear).sub(new Decimal(totalRevenuePastYear))).div(new Decimal(totalRevenuePastYear)))

    // **calculando churn** :

    let counter2 = 1;
    let totalAmountEnabledClients = 0;
    let totalAmountDisabledClients = 0;
    //calculando o número total de clientes ativos:
    while (true) {
      const config = {
        method: 'get',
        url: `https://app.vindi.com.br/api/v1/customers?page=${counter2}&per_page=25&sort_by=created_at&sort_order=asc`,
        headers: {
          accept: 'application/json',
        },
        auth: {
          username: `${accessToken}`,
          password: '',
        },
      };

      let dado;
      try {
        await axios(config).then(function (response) {
          dado = response.data.customers;
        });
      } catch (err) {
        this.logService.createErrorLog(
          'getDataFromVindi',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(config),
          undefined,
          usuarioId,
        );
        console.log(err);
        throw new BadRequestException('Vindi', {
          cause: new Error(),
          description: err,
        });
      }

      if (dado.length === 0) break;
      for (let i = 0; i < dado.length; i++) {
        if (dado[i].status === 'active')
          totalAmountEnabledClients = totalAmountEnabledClients + 1;
        if (dado[i].status === 'inactive')
          totalAmountDisabledClients = totalAmountDisabledClients + 1;
      }
      counter2++;
    }

    const totalClients = totalAmountDisabledClients + totalAmountEnabledClients;
    const churn = totalAmountDisabledClients / totalClients;

    await this.prisma.vindiAPIConnection.update({
      where: {
        usuarioId,
      },
      data: {
        data: finalList,
        updateTimestamp: String(Math.round(Date.now() / 1000)),
        receitaTotal: JSON.stringify(totalRevenue),
        totalTimestamp: String(finalTimestamp - firstTimestamp),
        receitaMensal: JSON.stringify(mensalRevenue),
        receitaPorMes: JSON.stringify(revenuePerMonth),
        receitaPorAno: JSON.stringify(revenuePerYear),
        receitaAnual: JSON.stringify(anualRevenue),
        activeSubscriptions: JSON.stringify(totalAmountEnabledClients),
        churn: JSON.stringify(churn),
        ARPU: JSON.stringify(ARPU),
        unPaidMRR: JSON.stringify(unPaidMRR),
        ARRGrowthYoY: JSON.stringify(ARRGrowthYoY),
        isUpdated: true,
      },
    });

    const userVindi = await this.prisma.vindiAPIConnection.findFirst({
      where: {
        usuarioId,
      },
    });
    const user = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
      },
    });

    //subscrevendo os dados no excel:
    const dataAtual = new Date(); // cria uma nova data com a data e hora atuais
    const dia = dataAtual.getDate().toString().padStart(2, '0'); // obtém o dia e adiciona um zero à esquerda, se necessário
    const mes = (dataAtual.getMonth() + 1).toString().padStart(2, '0'); // obtém o mês (0 = janeiro, 1 = fevereiro, etc.) e adiciona um zero à esquerda, se necessário
    const ano = dataAtual.getFullYear(); // obtém o ano com quatro dígitos
    const dataAtualFormatada = `${dia}/${mes}/${ano}`;

    //data criada em:
    const dataCriadoEm = user.criadoEm;
    const dataCriadoEmData = new Date(dataCriadoEm);

    const diaCriadoEm = dataCriadoEmData.getDate().toString().padStart(2, '0');
    const mesCriadoEm = (dataCriadoEmData.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const anoCriadoEm = dataCriadoEmData.getFullYear().toString();

    const dataCriadoEmFormatada = `${diaCriadoEm}/${mesCriadoEm}/${anoCriadoEm}`;

    const finalValuesArray = [];
    for (const key in revenuePerMonth) {
      const value = [
        userVindi.id,
        user.nomeEmpresa,
        key,
        JSON.stringify(unPaidMRR[key]),
        JSON.stringify(churn[key]),
        JSON.stringify(ARPU[key]),
        JSON.stringify(ARRGrowthYoY[key]),
        JSON.stringify(totalAmountEnabledClients[key]),
        JSON.stringify(revenuePerYear[key]),
        JSON.stringify(revenuePerMonth[key]),
        dataAtualFormatada,
        dataCriadoEmFormatada,
      ];
      finalValuesArray.push(value);
    }
    const arrayHeaders = [
      'StartupId',
      'Startup',
      'Data',
      'unPaidMRR',
      'churn',
      'ARPU',
      'ARRGrowthYoY',
      'totalAmountEnabledClients',
      'receitaPorAno',
      'receitaPorMes',
      'atualizadoEm',
      'criadoEm',
    ];
    finalValuesArray.unshift(arrayHeaders);

    this.googleSheetsService.writeSheet(usuarioId, finalValuesArray, 'vindi');
  }

  //Esta função serve para pegar os dados da Pluggy do cliente, passando a apikey essa função.
  public async getDataFromPluggy(itemId: string, usuarioId: string, pluggyId: string) {
    const userPluggy = await this.prisma.pluggyAPIConnection.findFirst({
      where: {
        id: pluggyId,
        usuarioId,
      },
    });

    let balanceAccount = JSON.parse(userPluggy.checkingAccountBalance);
    let creditAccount = JSON.parse(userPluggy.creditCardBalance);

    if (!balanceAccount) {
      balanceAccount = {};
    }
    if (!creditAccount) {
      creditAccount = {};
    }

    const data = {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    };
    const configAPI = {
      method: 'post',
      url: `https://api.pluggy.ai/auth`,
      headers: {
        accept: 'application/json',
      },
      data,
    };
    let dadoAPI;
    try {
      await axios(configAPI).then(function (response) {
        dadoAPI = response.data.apiKey;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'getDataFromPluggy',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        usuarioId,
      );
      console.log(err);
      throw new BadRequestException('Pluggy', {
        cause: new Error(),
        description: err,
      });
    }

    let checkingAccountBalance = 0;
    let creditCardLimit = 0;
    let availableCreditLimit = 0;

    const configAccount = {
      method: 'get',
      url: `https://api.pluggy.ai/accounts?itemId=${itemId}`,
      headers: {
        'X-API-KEY': dadoAPI,
        accept: 'application/json',
      },
    };
    let dadoAccount;
    try {
      await axios(configAccount).then(function (response) {
        dadoAccount = response.data.results;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'getDataFromPluggy',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAccount),
        undefined,
        usuarioId,
      );
      console.log(err);
    }

    if (dadoAccount.length > 0) {
      for (let i = 0; i < dadoAccount.length; i++) {
        if (dadoAccount[i].subtype === 'CHECKING_ACCOUNT') {
          checkingAccountBalance =
            // eslint-disable-next-line prettier/prettier
            Number(new Decimal(checkingAccountBalance).plus(new Decimal(dadoAccount[i].balance)));
        }
        if (dadoAccount[i].subtype === 'CREDIT_CARD') {
          creditCardLimit =
            // eslint-disable-next-line prettier/prettier
            Number(new Decimal(creditCardLimit).plus(new Decimal(dadoAccount[i].creditData.creditLimit)));
          availableCreditLimit =
            // eslint-disable-next-line prettier/prettier
            Number(new Decimal(availableCreditLimit).plus(new Decimal(dadoAccount[i].creditData.availableCreditLimit)));
        }
      }
    }

    //pegando as últimas 1000 transações do usuario:
    //vamos pegar apenas da conta 1, pois ela traz todas as informações necessárias.
    let transactions = [];
    if (dadoAccount.length > 0) {
      let rawTransactions = [];
      const configAccount = {
        method: 'get',
        url: `https://api.pluggy.ai/transactions?accountId=${dadoAccount[0].id}&pageSize=500`,
        headers: {
          'X-API-KEY': dadoAPI,
          accept: 'application/json',
        },
      };
      try { 
        await axios(configAccount).then(function (response) {
          rawTransactions = response.data.results;
        });
      } catch(err) {
        this.logService.createErrorLog(
          'getDataFromPluggy',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(configAccount),
          undefined,
          usuarioId,
        );
        console.log(err);
      }
      let rawTransactions2 = [];
      const configAccount2 = {
        method: 'get',
        url: `https://api.pluggy.ai/transactions?accountId=${dadoAccount[0].id}&pageSize=500&page=2`,
        headers: {
          'X-API-KEY': dadoAPI,
          accept: 'application/json',
        },
      };
      try {
        await axios(configAccount2).then(function (response) {
          rawTransactions2 = response.data.results;
        });
      } catch (err) {
        this.logService.createErrorLog(
          'getDataFromPluggy',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(configAccount2),
          undefined,
          usuarioId,
        );
        console.log(err);
      }
      transactions = rawTransactions.concat(rawTransactions2);
    }

    const investments = {};

    const configInv = {
      method: 'get',
      url: `https://api.pluggy.ai/investments?itemId=${itemId}`,
      headers: {
        'X-API-KEY': dadoAPI,
        accept: 'application/json',
      },
    };
    let dadoInv;
    try {
      await axios(configInv).then(function (response) {
        dadoInv = response.data.results;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'getDataFromPluggy',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configInv),
        undefined,
        usuarioId,
      );
      console.log(err);
    }

    if (dadoInv.length > 0) {
      for (let i = 0; i < dadoInv.length; i++) {
        if (dadoInv[i].balance.status === 'ACTIVE') {
          if (!investments[dadoInv[i].subtype])
            investments[dadoInv[i].subtype] = 0;
          investments[dadoInv[i].subtype] =
            // eslint-disable-next-line prettier/prettier
            Number(new Decimal(investments[dadoInv[i].subtype]).plus(new Decimal(dadoInv[i].balance)));
        }
      }
    }

    const date = new Date();

    const year = date.getFullYear();

    let month: any = date.getMonth() + 1;
    month = (month < 10 ? '0' : '') + month;
    const result = year + '-' + month;

    balanceAccount[result] = checkingAccountBalance;
    creditAccount[result] = creditCardLimit;

    const configKYB = {
      method: 'get',
      url: `https://api.pluggy.ai/identity?itemId=${itemId}`,
      headers: {
        'X-API-KEY': dadoAPI,
        accept: 'application/json',
      },
    };
    let dadoKYB;
    try {
      await axios(configKYB).then(function (response) {
        dadoKYB = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'getDataFromPluggy',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configKYB),
        undefined,
        usuarioId,
      );
      console.log(err);
    }

    await this.prisma.pluggyAPIConnection.update({
      where: {
        id: pluggyId,
      },
      data: {
        checkingAccountBalance: JSON.stringify(balanceAccount),
        creditCardBalance: JSON.stringify(creditAccount),
        investments: JSON.stringify(dadoInv),
        KYB: JSON.stringify(dadoKYB),
        isUpdated: true,
        transactions: transactions,
        updateTimestamp: String(Math.round(Date.now() / 1000)),
      },
    });

    const user = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
      },
    });
    const finalArrayItemsPluggy = user.pluggyItemIds;
    if (!(finalArrayItemsPluggy.includes(itemId))) {
      await this.prisma.usuario.update({
        where: {
          id: usuarioId,
        },
        data: {
          pluggyItemIds: finalArrayItemsPluggy,
        },
      });
    }

    //subscrevendo os dados no excel pluggy-balanco:
    const dataAtual = new Date(); // cria uma nova data com a data e hora atuais
    const dia = dataAtual.getDate().toString().padStart(2, '0'); // obtém o dia e adiciona um zero à esquerda, se necessário
    const mes = (dataAtual.getMonth() + 1).toString().padStart(2, '0'); // obtém o mês (0 = janeiro, 1 = fevereiro, etc.) e adiciona um zero à esquerda, se necessário
    const ano = dataAtual.getFullYear(); // obtém o ano com quatro dígitos
    const dataAtualFormatada = `${dia}/${mes}/${ano}`;

    //data criada em:
    const dataCriadoEm = userPluggy.criadoEm;
    const dataCriadoEmData = new Date(dataCriadoEm);

    const diaCriadoEm = dataCriadoEmData.getDate().toString().padStart(2, '0');
    const mesCriadoEm = (dataCriadoEmData.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const anoCriadoEm = dataCriadoEmData.getFullYear().toString();

    const finalValuesArray = [];
    for (const key in balanceAccount) {
      const value = [
        userPluggy.id,
        user.nomeEmpresa,
        key,
        JSON.stringify(dadoInv[key]),
        JSON.stringify(balanceAccount[key]),
        JSON.stringify(creditAccount[key]),
        JSON.stringify(dadoKYB[key]),
        userPluggy.connectorName,
        dataAtualFormatada,
      ];
      finalValuesArray.push(value);
    }
    const arrayHeaders = [
      'StartupId',
      'Startup',
      'Data',
      'investimentos',
      'saldo da conta',
      'crédito disponível da conta',
      'KYB',
      'Banco',
      'atualizadoEm',
    ];
    finalValuesArray.unshift(arrayHeaders);

    this.googleSheetsService.writeSheet(usuarioId, finalValuesArray, `pluggy-balancos-${userPluggy.id}`);

    //subscrevendo os dados no excel pluggy-transacoes:
    const finalValuesArrayTransacao = [];
    for (const key in transactions) {
      const date = new Date(transactions[key].date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const value = [
        userPluggy.id,
        user.nomeEmpresa,
        `${year}-${month}-${day}`,
        transactions[key].description,
        transactions[key].currencyCode,
        JSON.stringify(transactions[key].amount),
        JSON.stringify(transactions[key].balance),
        transactions[key].type,
        transactions[key].status,
        transactions[key].category,
        userPluggy.connectorName,
        dataAtualFormatada,
      ];
      finalValuesArrayTransacao.push(value);
    }
    const arrayHeadersTransacao = [
      'StartupId',
      'Startup',
      'Data',
      'descricao',
      'moeda',
      'montante transacionado', //quanto foi transacionado nesta transação
      'balanço após transacao', //quanto ficou o balanço na conta após essa transação ser feita
      'type', //se foi um credit é pois saiu dinheiro, se foi um debit é pois entrou dinheiro
      'status', //qual status da transação, se ela já foi realizada
      'categoria', //qual a categoria da transacao
      'Banco',
      'atualizadoEm',
    ];
    finalValuesArrayTransacao.unshift(arrayHeadersTransacao);

    this.googleSheetsService.writeSheet(usuarioId, finalValuesArrayTransacao, `pluggy-transacoes-${userPluggy.id}`);

  }

  //Realiza o KYB do usuario pela plataforma da BigData.
  public async KYBBigData(dataObj: any) {
    // const user = await this.prisma.usuario.findFirst({
    //   where: {
    //     id: usuarioId,
    //   },
    // });
    console.log('comecei o kyb')
    //chamada de compliance:
    const data = {
      Datasets: 'kyc',
      q: `doc{${dataObj.cnpj}}`,
    };
    const configAPI = {
      method: 'post',
      url: `https://plataforma.bigdatacorp.com.br/empresas`,
      headers: {
        accept: 'application/json',
        AccessToken: this.kybAccessToken,
        TokenId: this.kybTokenId,
      },
      data: data,
    };

    let dadoAPIComplianceInfo: any;
    try {
      await axios(configAPI).then(function (response) {
        dadoAPIComplianceInfo = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'KYBBigData',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        JSON.stringify(`Erro durante KYB - compliance ` + dataObj.cnpj),
        undefined,
      );
      console.log(err);
    }

    //chamada de info basica:
    const data2 = {
      Datasets: 'basic_data',
      q: `doc{${dataObj.cnpj}}`,
    };
    const configAPI2 = {
      method: 'post',
      url: `https://plataforma.bigdatacorp.com.br/empresas`,
      headers: {
        accept: 'application/json',
        AccessToken: this.kybAccessToken,
        TokenId: this.kybTokenId,
      },
      data: data2,
    };

    let dadoAPIInfoBasica: any;
    try {
      await axios(configAPI2).then(function (response) {
        dadoAPIInfoBasica = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'KYBBigData',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI2),
        JSON.stringify(`Erro durante KYB - empresas ` + dataObj.cnpj),
        undefined,
      );
      console.log(err);
    }

    //chamada de processos judiciais socios:
    const data3 = {
      Datasets: 'owners_lawsuits',
      q: `doc{${dataObj.cnpj}}`,
    };
    const configAPI3 = {
      method: 'post',
      url: `https://plataforma.bigdatacorp.com.br/empresas`,
      headers: {
        accept: 'application/json',
        AccessToken: this.kybAccessToken,
        TokenId: this.kybTokenId,
      },
      data: data3,
    };

    let dadoAPIProcessosJudiciaisSocios: any;
    try {
      await axios(configAPI3).then(function (response) {
        dadoAPIProcessosJudiciaisSocios = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'KYBBigData',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI3),
        JSON.stringify(`Erro durante KYB - processos judiciais socios ` + dataObj.cnpj),
      );
      console.log(err);
    }

    //chamada de processos judiciais empresa:
    const data4 = {
      Datasets: 'processes',
      q: `doc{${dataObj.cnpj}}`,
    };
    const configAPI4 = {
      method: 'post',
      url: `https://plataforma.bigdatacorp.com.br/empresas`,
      headers: {
        accept: 'application/json',
        AccessToken: this.kybAccessToken,
        TokenId: this.kybTokenId,
      },
      data: data4,
    };

    let dadoAPIProcessosJudiciaisEmpresa: any;
    try {
      await axios(configAPI4).then(function (response) {
        dadoAPIProcessosJudiciaisEmpresa = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'KYBBigData',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI4),
        JSON.stringify(`Erro durante KYB - processos judiciais empresa ` + dataObj.cnpj),
      );
      console.log(err);
    }
    console.log('fazendo o obj')
    console.log(dadoAPIComplianceInfo)
    console.log(dadoAPIInfoBasica)
    console.log(dadoAPIProcessosJudiciaisSocios)
    console.log(dadoAPIProcessosJudiciaisEmpresa) 
    const finalObj = {
      'PEP histórico': dadoAPIComplianceInfo['Result'][0]['KycData']['PEPHistory'],
      'É PEP atualmente?': dadoAPIComplianceInfo['Result'][0]['KycData']['IsCurrentlyPEP'],
      'É sancionado atualmente?': dadoAPIComplianceInfo['Result'][0]['KycData']['IsCurrentlySanctioned'],
      'É um doador eleitoral atualmente?': dadoAPIComplianceInfo['Result'][0]['KycData']['IsCurrentlyElectoralDonor'],
      'É um doador eleitoral historicamente?':
        dadoAPIComplianceInfo['Result'][0]['KycData'][
          'IsHistoricalElectoralDonor'
        ],
      'País': dadoAPIInfoBasica['Result'][0]['BasicData']['TaxIdCountry'],
      'Razão social': dadoAPIInfoBasica['Result'][0]['BasicData']['OfficialName'],
      'Data de fundação': dadoAPIInfoBasica['Result'][0]['BasicData']['FoundedDate'],
      'Estado da matriz': dadoAPIInfoBasica['Result'][0]['BasicData']['HeadquarterState'],
      'É um conglomerado?': dadoAPIInfoBasica['Result'][0]['BasicData']['IsConglomerate'],
      'Situação cadastral do taxId': dadoAPIInfoBasica['Result'][0]['BasicData']['TaxIdStatus'],
      'Origem do taxId': dadoAPIInfoBasica['Result'][0]['BasicData']['TaxIdOrigin'],
      'Regime cadastral': dadoAPIInfoBasica['Result'][0]['BasicData']['TaxRegime'],
      'Tipo de empresa': dadoAPIInfoBasica['Result'][0]['BasicData']['CompanyType_ReceitaFederal'],
      'Atividades': dadoAPIInfoBasica['Result'][0]['BasicData']['Activities'],
      'Natureza legal': dadoAPIInfoBasica['Result'][0]['BasicData']['LegalNature'],
      'Capital': dadoAPIInfoBasica['Result'][0]['BasicData']['AdditionalOutputData']['CapitalRS'],
      'Número total de processos judiciais e administrativos da empresa': dadoAPIProcessosJudiciaisEmpresa['Result'][0]['Lawsuits']['TotalLawsuits'],
      'Número total de processos judiciais dos sócios': dadoAPIProcessosJudiciaisSocios['Result'][0]['OwnersLawsuits']['TotalLawsuits'],
      'Processos judiciais e administrativos da empresa': dadoAPIProcessosJudiciaisEmpresa['Result'][0]['Lawsuits']['Lawsuits'],
      'Processos judiciais dos sócios': dadoAPIProcessosJudiciaisSocios['Result'][0]['OwnersLawsuits']['Lawsuits'],
      'Dados históricos': dadoAPIInfoBasica['Result'][0]['BasicData']['HistoricalData'],
    }
    console.log('fazendo o docs')
    if (finalObj['Atividades'].length > 0) {
      const arrayAtividades = []
      for (let i = 0; i < finalObj['Atividades'].length; i++) {
        arrayAtividades.push(finalObj['Atividades'][i]['Activity'])
      }
      finalObj['Atividades'] = arrayAtividades;
    }
  
    if (finalObj['Natureza legal']) { 
      finalObj['Natureza legal'] = `${finalObj['Natureza legal']['Code']} - ${finalObj['Natureza legal']['Activity']}`
    }

    //Tratamento: Processos da empresa
    if (finalObj['Número total de processos judiciais e administrativos da empresa'] > 0) {
      const finalArrayProcessosEmpresa = [];
      for (let i = 0; i < finalObj['Processos judiciais e administrativos da empresa'].length; i++) {
        const objUnico = {
          "Number": finalObj['Processos judiciais e administrativos da empresa'][i]['Number'],
          "Type": finalObj['Processos judiciais e administrativos da empresa'][i]['Type'],
          "MainSubject": finalObj['Processos judiciais e administrativos da empresa'][i]['MainSubject'],
          "CourtName": finalObj['Processos judiciais e administrativos da empresa'][i]['CourtName'],
          "CourtLevel": finalObj['Processos judiciais e administrativos da empresa'][i]['CourtLevel'],
          "CourtType": finalObj['Processos judiciais e administrativos da empresa'][i]['CourtType'],
          "CourtDistrict": finalObj['Processos judiciais e administrativos da empresa'][i]['CourtDistrict'],
          "JudgingBody": finalObj['Processos judiciais e administrativos da empresa'][i]['JudgingBody'],
          "Status": finalObj['Processos judiciais e administrativos da empresa'][i]['Status'],
          "NoticeDate": finalObj['Processos judiciais e administrativos da empresa'][i]['NoticeDate'],
          "LastUpdate": finalObj['Processos judiciais e administrativos da empresa'][i]['LastUpdate'],
        }
        finalArrayProcessosEmpresa.push(objUnico)
      }
      finalObj['Processos judiciais e administrativos da empresa'] = finalArrayProcessosEmpresa;
    } else {
      finalObj['Processos judiciais e administrativos da empresa'] = '-'
    }
  
    //Tratamento: Processos dos sócios
    if (finalObj['Número total de processos judiciais dos sócios'] > 0) {
      const finalArrayProcessosSocios = [];
      for (const key in finalObj['Processos judiciais dos sócios']) {
        for (let i = 0; i < finalObj['Processos judiciais dos sócios'][key]['Lawsuits'].length; i ++) {
          const objUnico = {
            "Number": finalObj['Processos judiciais dos sócios'][key]['Lawsuits'][i]['Number'],
            "Type": finalObj['Processos judiciais dos sócios'][key]['Lawsuits'][i]['Type'],
            "MainSubject": finalObj['Processos judiciais dos sócios'][key]['Lawsuits'][i]['MainSubject'],
            "CourtName": finalObj['Processos judiciais dos sócios'][key]['Lawsuits'][i]['CourtName'],
            "CourtLevel": finalObj['Processos judiciais dos sócios'][key]['Lawsuits'][i]['CourtLevel'],
            "CourtType": finalObj['Processos judiciais dos sócios'][key]['Lawsuits'][i]['CourtType'],
            "CourtDistrict": finalObj['Processos judiciais dos sócios'][key]['Lawsuits'][i]['CourtDistrict'],
            "JudgingBody": finalObj['Processos judiciais dos sócios'][key]['Lawsuits'][i]['JudgingBody'],
            "Status": finalObj['Processos judiciais dos sócios'][key]['Lawsuits'][i]['Status'],
            "NoticeDate": finalObj['Processos judiciais dos sócios'][key]['Lawsuits'][i]['NoticeDate'],
            "LastUpdate": finalObj['Processos judiciais dos sócios'][key]['Lawsuits'][i]['LastUpdate'],
          }
          finalArrayProcessosSocios.push(objUnico)
        }
      }
      finalObj['Processos judiciais dos sócios'] = finalArrayProcessosSocios;
    } else {
      finalObj['Processos judiciais dos sócios'] = '-'
    }

    let finalName = dataObj.cnpj
    if(dataObj.nome) {
      finalName = `${dataObj.nome}-${dataObj.cnpj}`
    }
    await this.googleSheetsService.createDocStartup(finalObj, finalName);

    // await this.prisma.kYBUsuario.update({
    //   where: {
    //     usuarioId: usuarioId,
    //   },
    //   data: {
    //     isUpdated: true,
    //     updateTimestamp: String(Math.round(Date.now() / 1000)),
    //     complianceInfo: JSON.stringify(dadoAPIComplianceInfo),
    //     infoBasica: JSON.stringify(dadoAPIInfoBasica),
    //     processosJudiciaisSocios: JSON.stringify(
    //       dadoAPIProcessosJudiciaisSocios,
    //     ),
    //   },
    // });
    return finalObj;
  }

   //Realiza o KYB do usuario pela plataforma da ComplyCube.
   public async kybComplyCube(dataObj: KYBComplyCubeDTO) {
    console.log('comecei o kyb - complyCube')

    //criando o user-empresa:
    const data = {
      type: "company",
      email: dataObj.emailEmpresa,
      companyDetails: {
        name: dataObj.nomeEmpresa,
        website: dataObj.websiteEmpresa,
        registrationNumber: String(dataObj.cnpjEmpresa),
        incorporationCountry: "BR"
      },
    };
    const configAPI = {
      method: 'post',
      url: `https://api.complycube.com/v1/clients`,
      headers: {
        accept: 'application/json',
        Authorization: this.kybComplyCubeAccessToken,
      },
      data: data,
    };

    let dadoAPIClientInfo: any;
    console.log('criando o client')
    try {
      await axios(configAPI).then(function (response) {
        dadoAPIClientInfo = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'KYBComplyCube',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        JSON.stringify(`Erro durante KYB - criacao de cliente - complyCube ` + dataObj.cnpjEmpresa),
        undefined,
      );
      console.log(err);
      throw new BadRequestException('KYBComplyCube', {
        cause: new Error(),
        description: err,
      });    
    }

    //realizando o kyc AML:
    console.log('realizando o kyc AML')
    const data2 = {
      clientId: dadoAPIClientInfo.id,
      type: "extensive_screening_check"
    };
    const configAPI2 = {
      method: 'post',
      url: `https://api.complycube.com/v1/checks`,
      headers: {
        accept: 'application/json',
        Authorization: this.kybComplyCubeAccessToken,
      },
      data: data2,
    };
    let dadoReturnKYB;
    try {
      await axios(configAPI2).then(function (response) {
        dadoReturnKYB = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'KYBComplyCube',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI2),
        JSON.stringify(`Erro durante KYB - AML ` + dataObj.cnpjEmpresa),
        undefined,
      );
      console.log(err);
      throw new BadRequestException('KYBComplyCube', {
        cause: new Error(),
        description: err,
      });    
    }

    await this.prisma.kYBComplyCube.create({
      data: {
        checkId: dadoReturnKYB.id, 
        cnpjEmpresa: String(dataObj.cnpjEmpresa),
        nomeEmpresa: dataObj.nomeEmpresa,
      }
    })

  }

    //O webhook da complyCube.
    public async webhookKYBComplyCube(dataObj: any, req: Request) {
      console.log('webhook chamado kyb - complyCube');
      const eventVerifier = new EventVerifier(this.kybComplyCubeWebhookSecret);
      const signature = req.headers['complycube-signature'] as string;

      try {
        eventVerifier.constructEvent(JSON.stringify(dataObj), signature);
      }
      catch (err) {
        console.log(err);
        console.log('webhook signature incorreta kyb - complyCube');
        throw new BadRequestException('KYBComplyCube', {
          cause: new Error(),
          description: err,
        });  
      }
      console.log('pegando infos do kyb')
    
      //pegando as infos do kyb:
      const configAPI = {
        method: 'get',
        url: `https://api.complycube.com/v1/checks/${dataObj.payload.id}`,
        headers: {
          accept: 'application/json',
          Authorization: this.kybComplyCubeAccessToken,
        },
      };
      let dadoAPIKYBInfo: any;
      try {
        await axios(configAPI).then(function (response) {
          dadoAPIKYBInfo = response.data;
        });
      } catch (err) {
        this.logService.createErrorLog(
          'KYBComplyCubeWebhook',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(configAPI),
          JSON.stringify(`Erro durante KYB - KYBComplyCubeWebhook - complyCube ` + JSON.stringify(dataObj)),
          undefined,
        );
        console.log('erro na getCheck');
        return
      }

      console.log('recebi esses dados');
      console.log(dadoAPIKYBInfo)
      console.log(JSON.stringify(dadoAPIKYBInfo))


      console.log('Escrevendo os dados em um doc')
      const finalObj = {
          'Resultado geral': dadoAPIKYBInfo['result']['outcome'],
          'PEP - Level 1': dadoAPIKYBInfo['result']['breakdown']['summary']['pep']['level1'],
          'PEP - Level 2': dadoAPIKYBInfo['result']['breakdown']['summary']['pep']['level2'],
          'PEP - Level 3': dadoAPIKYBInfo['result']['breakdown']['summary']['pep']['level3'],
          'PEP - Level 4': dadoAPIKYBInfo['result']['breakdown']['summary']['pep']['level4'],
          'Lista de sanções': dadoAPIKYBInfo['result']['breakdown']['summary']['watchlist']['sanctionsLists'],
          'Crimes de guerra': dadoAPIKYBInfo['result']['breakdown']['summary']['watchlist']['warCrimes'],
          'Terrorismo': dadoAPIKYBInfo['result']['breakdown']['summary']['watchlist']['terror'],
          'Controle e ownership de sanções': dadoAPIKYBInfo['result']['breakdown']['summary']['watchlist']['sanctionsControlAndOwnership'],
          'Outras listas oficiais': dadoAPIKYBInfo['result']['breakdown']['summary']['watchlist']['otherOfficialLists'],
          'Outras listas de exclusão': dadoAPIKYBInfo['result']['breakdown']['summary']['watchlist']['otherExclusionLists'],
          'Produção ambiental': dadoAPIKYBInfo['result']['breakdown']['summary']['adverseMedia']['environmentProduction'],
          'Trabalho social': dadoAPIKYBInfo['result']['breakdown']['summary']['adverseMedia']['socialLabour'],
          'Competitive Financial': dadoAPIKYBInfo['result']['breakdown']['summary']['adverseMedia']['competitiveFinancial'],
          'Listas regulatórias': dadoAPIKYBInfo['result']['breakdown']['summary']['adverseMedia']['regulatory'],
          'Listas de entidades associadas': dadoAPIKYBInfo['result']['breakdown']['summary']['otherLists']['associatedEntity'],
          'Crime organizado': dadoAPIKYBInfo['result']['breakdown']['summary']['otherLists']['organisedCrime'],
          'Crimes financeiros': dadoAPIKYBInfo['result']['breakdown']['summary']['otherLists']['financialCrime'],
          'Crimes de evasão fiscal': dadoAPIKYBInfo['result']['breakdown']['summary']['otherLists']['taxCrime'],
          'Crimes de corrupção': dadoAPIKYBInfo['result']['breakdown']['summary']['otherLists']['corruption'],
          'Crimes de tráfico': dadoAPIKYBInfo['result']['breakdown']['summary']['otherLists']['trafficking'],
      }
      
      const finalName = dadoAPIKYBInfo['entityName'];
      console.log('webhook kyb - 1 step - sucesso')

      //pegando informações do sócio pelo kyb da bigDataCorp:
      const infoEmpresa = await this.prisma.kYBComplyCube.findFirst({
        where: {
          checkId: dataObj.payload.id
        }
      })
      console.log('achei esse infoEmpresa');
      console.log(dataObj.payload.id)
      console.log(infoEmpresa)

      const data2 = {
          Datasets: 'owners_kyc',
          q: `doc{${infoEmpresa.cnpjEmpresa}}`,
        };
      const configAPI2 = {
        method: 'post',
        url: `https://plataforma.bigdatacorp.com.br/empresas`,
        headers: {
          accept: 'application/json',
          AccessToken: this.kybAccessToken,
          TokenId: this.kybTokenId,
        },
        data: data2,
      };

      let dadoAPIKYCSocios: any;
      try {
        await axios(configAPI2).then(function (response) {
          dadoAPIKYCSocios = response.data;
          console.log('esses dados');
          console.log(dadoAPIKYCSocios)
        });
      } catch (err) {
        this.logService.createErrorLog(
          'KYBBigData',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(configAPI2),
          JSON.stringify(`Erro durante KYB - dadoAPIKYCSocios ` + infoEmpresa.cnpjEmpresa),
        );
        console.log(err);
      }
    console.log('realizando o tratamento de info dos socios')
    // Pegue o objeto 'OwnersKycData' de dadoAPIKYCSocios.
    const ownersKycData = dadoAPIKYCSocios['Result'][0]['OwnersKycData']['OwnersKycData'];

    if(ownersKycData) {
      console.log('infoEncontrada')
      console.log(ownersKycData)
      // Itere sobre cada sócio no objeto 'OwnersKycData'.
      for (const socioId in ownersKycData) {
        // Crie uma nova chave no objeto 'finalObj' para cada sócio.
        finalObj[`Sócio - ${socioId} é atualmente um PEP?`] = ownersKycData[socioId]['IsCurrentlyPEP'] ? 'Sim' : 'Não';
        finalObj[`Sócio - ${socioId} é atualmente sancionado?`] = ownersKycData[socioId]['IsCurrentlySanctioned'] ? 'Sim' : 'Não';
      }
    }
    finalObj['Para mais informações sobre as legendas dos parâmetros, acesse:'] = 'https://docs.complycube.com/documentation/checks/aml-screening-check';
    console.log('gerando o doc')
    console.log(finalObj);
    const numKeys = Object.keys(finalObj).length;
    await this.googleSheetsService.createDocStartupDynamic(finalObj, finalName, numKeys);
  }
  
  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
