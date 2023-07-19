import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ethers } from 'ethers';
import { SimpleCrypto } from 'simple-crypto-js';

import { PrismaService } from '../database/prisma.service';

import erc20ABI from '../auth/contract/erc20.json';

import { Request, response } from 'express';
import axios from 'axios';
import { AuthService } from 'src/auth/auth.service';
import { LogService } from '../internalFunctions/log.service';

@Injectable()
export class InfoService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly logService: LogService,
  ) {}
  simpleCryptoJs = new SimpleCrypto(process.env.CIPHER);

  usdcAddress = process.env.USDC_ADDRESS;

  web3UrlProvider = process.env.WEB3_URL_PROVIDER;
  web3Provider = new ethers.providers.JsonRpcProvider(this.web3UrlProvider);

  viewPrivateKey =
    'a7ec59c41ec3608dece33851a7d805bf22cd33da3e22e438bfe033349eb04011';

  contaAzulClientId = process.env.CONTA_AZUL_CLIENT_ID;
  contaAzulClientSecret = process.env.CONTA_AZUL_CLIENT_SECRET;
  contaAzulRedirectURI = process.env.CONTA_AZUL_REDIRECT;

  //chaves da pluggy
  clientId = process.env.CLIENT_ID;
  clientSecret = process.env.CLIENT_SECRET;

  //**ENDPOINTS:**
  //Endpoints de utilidade ao frontend. Esses endpoints servem para retornar ifnromações importantes como saldo do usuário; se passou por kyc...

  //retorna o balanço de um address na blockchain (usdc):
  async balanceOfUSDCMetamask(data: any) {
    const walletEther = new ethers.Wallet(this.viewPrivateKey);
    const connectedWallet = walletEther.connect(this.web3Provider);

    const newcontract = new ethers.Contract(
      this.usdcAddress,
      erc20ABI,
      this.web3Provider,
    );
    const contractSigner = await newcontract.connect(connectedWallet);

    const transact = await contractSigner.balanceOf(data.address);

    return Number(transact);
  }

  async getEmpresas() {
    const result = await this.prisma.empresa.findMany();
    const empresas = [];

    for (let i = 0; i < result.length; i++) {
      const object: any = result[i];
      empresas[i] = object;
    }

    return empresas;
  }

  async bankingAPIsStatus(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const finalStatus: any = {};

    //realizando contador de 'poder da conta':
    let bancario = 0;
    let subscricao = 0;
    let gestao = 0;

    //1º verificação - Netsuit:
    const codatId = user.codatId;
    const codatNetsuitId = user.codatNetsuitId;
    const userAddress = user.address;
    const userNetsuite = await this.prisma.netsuiteCodatAPIConnection.findFirst(
      {
        where: {
          usuarioId: user.id,
        },
      },
    );

    if (codatId && codatNetsuitId) {
      let apiKey;
      const resultsNetsuite = await this.prisma.codatAPIConnection.findMany();

      for (let i = 0; i < resultsNetsuite.length; i++) {
        const addr = resultsNetsuite[i].addresses;
        if (addr) {
          if (addr.includes(userAddress)) {
            apiKey = resultsNetsuite[i].apiKey;
            break;
          }
        }
      }
      const config = {
        method: 'get',
        url: `https://api.codat.io/companies/${codatId}/connections/${codatNetsuitId}`,
        headers: {
          Authorization: `Basic ${apiKey}`,
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
          'bankingAPIsStatus',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(config),
          undefined,
          user.id,
        );
        console.log(err);
      }

      if (dado.status === 'Unlinked') {
        finalStatus.netSuite = 'Unlinked';
      } else if (dado.status === 'PendingAuth') {
        finalStatus.netSuite = 'PendingAuth';
      } else if (!userNetsuite.isUpdated) {
        finalStatus.netSuite = 'PendingUpdate';
      } else if (dado.status === 'Linked') {
        gestao = 1;
        finalStatus.netSuite = 'Linked';
      }
    } else {
      finalStatus.netSuite = 'Unlinked';
    }

    //2º verificação - ContaAzul:
    const userContaAzul = await this.prisma.contaAzulAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });
    if (userContaAzul) {
      if (!userContaAzul.updateTimestamp) {
        finalStatus.contaAzul = 'Unlinked';
      } else if (!userContaAzul.isUpdated) {
        finalStatus.contaAzul = 'PendingUpdate';
      } else {
        subscricao = 1;
        finalStatus.contaAzul = 'Linked';
      }
    } else {
      finalStatus.contaAzul = 'Unlinked';
    }

    //3º verificação - Omie:
    const userOmie = await this.prisma.omieAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });

    if (userOmie) {
      if (userOmie.isUpdated) {
        gestao = 1;
        finalStatus.omie = 'Linked';
      } else {
        finalStatus.omie = 'PendingUpdate';
      }
    } else {
      finalStatus.omie = 'Unlinked';
    }

    //4º verificação - Vindi:
    const userVindi = await this.prisma.vindiAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });
    if (userVindi) {
      if (userVindi.isUpdated) {
        subscricao = 1;
        finalStatus.vindi = 'Linked';
      } else {
        finalStatus.vindi = 'PendingUpdate';
      }
    } else {
      finalStatus.vindi = 'Unlinked';
    }

    //5º verificação - Pluggy:
    const userPluggy = await this.prisma.pluggyAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });
    if (!userPluggy) {
      finalStatus.pluggy = 'Unlinked';
    } else if (!userPluggy.updateTimestamp) {
      finalStatus.pluggy = 'Unlinked';
    } else if (!userPluggy.isUpdated) {
      finalStatus.pluggy = 'PendingUpdate';
    } else {
      bancario = 1;
      finalStatus.pluggy = 'Linked';
    }

    //6º verificação - Google Analytics:
    const userGoogleAnalytics =
      await this.prisma.googleAnalyticsAPIConnection.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
    if (!userGoogleAnalytics) {
      finalStatus.googleAnalytics = 'Unlinked';
    } else if (!userGoogleAnalytics.updateTimestamp) {
      finalStatus.googleAnalytics = 'Unlinked';
    } else if (!userGoogleAnalytics.isUpdated) {
      finalStatus.googleAnalytics = 'PendingUpdate';
    } else {
      finalStatus.googleAnalytics = 'Linked';
    }

    const poderContaFinal = (
      ((bancario + subscricao + gestao) * 100) /
      3
    ).toFixed(0);
    finalStatus.poderContaFinal = poderContaFinal;
    finalStatus.bancario = bancario;
    finalStatus.subscricao = subscricao;
    finalStatus.gestao = gestao;

    return finalStatus;
  }
  async getFinanceData(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    let receitaTotal: any = {};
    let despesaTotal: any = {};
    let ARPU: any = {};
    let balance: any = {};
    const lucroOperacionalLiquido: any = {};

    //#1 Omie e Netsuite:
    const userNetsuite = await this.prisma.netsuiteCodatAPIConnection.findFirst(
      {
        where: {
          usuarioId: user.id,
        },
      },
    );
    const userOmie = await this.prisma.omieAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });
    //verifico se alguma das conexões foi realizada, se não não possuímos dados de contabilidade para voltar ao user.
    //calcular lucro operacional e receita total.
    if (userOmie && userOmie.receitaTotal) {
      receitaTotal = JSON.parse(userOmie.receitaTotal);
      despesaTotal = JSON.parse(userOmie.despesaTotal);
      for (const key in receitaTotal) {
        lucroOperacionalLiquido[key] = receitaTotal[key] - despesaTotal[key];
      }
    } else if (userNetsuite && userNetsuite.receitaTotal) {
      receitaTotal = JSON.parse(userNetsuite.receitaTotal);
      despesaTotal = JSON.parse(userNetsuite.despesaTotal);
      for (const key in receitaTotal) {
        lucroOperacionalLiquido[key] = receitaTotal[key] - despesaTotal[key];
      }
    }

    //#2 Vindi e Conta Azul:
    const userContaAzul = await this.prisma.contaAzulAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });

    const userVindi = await this.prisma.vindiAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });

    //verifico se alguma das conexões foi realizada, se não não possuímos dados de subscrição para voltar ao user.
    //calcular ARPU.
    if (userVindi && userVindi.ARPU) {
      ARPU = JSON.parse(userVindi.ARPU);
    } else if (userContaAzul && userContaAzul.ARPU) {
      ARPU = JSON.parse(userContaAzul.ARPU);
    }

    //#3 Pluggy:
    const userPluggy = await this.prisma.pluggyAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });

    //verifico se a conexão com pluggy foi realizada, se não não possuímos dados de bancários para voltar ao user.
    //calcular Balanço.
    if (userPluggy && userPluggy.checkingAccountBalance) {
      balance = JSON.parse(userPluggy.checkingAccountBalance);
    }
    balance = Object.fromEntries(Object.entries(balance).reverse());
    const finalObject = {
      ReceitaTotal: receitaTotal,
      LucroOperacionalLiquido: lucroOperacionalLiquido,
      Balanço: balance,
      ARPU: ARPU,
    };

    return finalObject;
  }

  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
