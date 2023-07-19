import {
  ConflictException,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import { join, extname } from 'path';
// import { import_ } from '@brillout/import';
import { ethers } from 'ethers';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { SimpleCrypto } from 'simple-crypto-js';

import { PrismaService } from '../database/prisma.service';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// import { PineconeClient } from '@pinecone-database/pinecone';

import { DidDTO } from './dto/did.dto';
import { Request, response } from 'express';
import axios from 'axios';

import { FinanceService } from '../internalFunctions/finance.service';
import { GoogleSheetsService } from '../internalFunctions/googleSheets.service';
import { GoogleBucketService } from '../internalFunctions/googleBucket.service';
import { EmailSenderService } from '../internalFunctions/emailSender.service';
import { LogService } from '../internalFunctions/log.service';
import { AuthService } from 'src/auth/auth.service';
import { GenerateAccessTokenContaAzulDTO } from './dto/generate-access-token-conta-azul.dto';
import { InitiateConnectionOmieDTO } from './dto/initiate-connection-omie.dto';
import { InitiateConnectionVindiDTO } from './dto/initiate-connection-vindi.dto';
import { PullPluggyDTO } from './dto/pull-pluggy.dto';

@Injectable()
export class OpenFinanceService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
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

  //**CONEXÕES APIS */

  //criação de conexão entre usuário (borrower) e connectionNetSuiteCodat:
  //retorna o link que o usuário usará para realizar a conexão.
  async initiateConnectionNetsuiteCodat(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const userNetsuite = await this.prisma.netsuiteCodatAPIConnection.findFirst(
      {
        where: {
          usuarioId: user.id,
        },
      },
    );

    if (userNetsuite)
      return `https://link-api.codat.io/companies/${userNetsuite.codatId}/connections/${userNetsuite.codatNetsuiteId}/start`;

    //se user ainda não iniciou conexão, vamos criar uma:
    let apiKey = null;
    const resultsConn = await this.prisma.codatAPIConnection.findMany();
    for (let i = 0; i < resultsConn.length; i++) {
      const addr = resultsConn[i].addresses;
      if (!addr) {
        apiKey = resultsConn[i].apiKey;
        break;
      } else {
        if (addr.length < 4) {
          apiKey = resultsConn[i].apiKey;
          break;
        }
      }
    }
    if (!apiKey) {
      console.log('Maximum amount of connections reached');
      throw new BadRequestException('Netsuite', {
        cause: new Error(),
        description: 'Maximum amount of connections reached',
      });
    }

    const dataNetsuite = {
      name: `${user.address}`,
      platformType: 'akxx',
    };
    const config = {
      method: 'post',
      url: `https://api.codat.io/companies`,
      headers: {
        Authorization: `Basic ${apiKey}`,
        accept: 'application/json',
      },
      data: dataNetsuite,
    };
    let dado;
    try {
      await axios(config).then(function (response) {
        dado = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'initiateConnectionNetsuiteCodat',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(config),
        undefined,
        user.id,
      );
      console.log(err);
      throw new BadRequestException('Netsuite', {
        cause: new Error(),
        description: err,
      });
    }

    const codatArray = await this.prisma.codatAPIConnection.findFirst({
      where: {
        apiKey: apiKey,
      },
    });

    const finalArray = codatArray.addresses;
    finalArray.push(user.address);

    await this.prisma.codatAPIConnection.update({
      where: {
        apiKey: apiKey,
      },
      data: {
        addresses: finalArray,
      },
    });

    await this.prisma.netsuiteCodatAPIConnection.create({
      data: {
        usuarioId: user.id,
        codatId: dado.id,
        updateTimestamp: String(Math.round(Date.now() / 1000)),
        codatNetsuiteId: dado.dataConnections[0].id,
        codatAPIKey: apiKey,
      },
    });

    return dado.dataConnections[0].linkUrl;
  }

  async pullDataNetsuiteCodat(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const userNetsuite = await this.prisma.netsuiteCodatAPIConnection.findFirst(
      {
        where: {
          usuarioId: user.id,
        },
      },
    );

    if (!userNetsuite)
      throw new BadRequestException('Netsuite', {
        cause: new Error(),
        description: 'Did not find any connection',
      });

    await this.financeService.getDataFromNetsuite(
      userNetsuite.codatId,
      userNetsuite.codatNetsuiteId,
      user.address,
      user.id,
    );
  }

  //criação de conexão entre usuário (borrower) e conta azul:
  //retorna o link que o usuário usará para realizar a conexão.
  async initiateConnectionContaAzul(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const scalableClientId = this.contaAzulClientId;
    //a redirect uri sempre deve ser atualizada na aplicação da scalable da conta azul, também.
    const scalableRedirectURI = this.contaAzulRedirectURI;

    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const userContaAzul = await this.prisma.contaAzulAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });

    if (userContaAzul) {
      return `https://api.contaazul.com/auth/authorize?redirect_uri=${scalableRedirectURI}&client_id=${scalableClientId}&scope=sales&state=${userContaAzul.stateCode}`;
    } else {
      const id = crypto.randomBytes(16);
      const id2 = id.toString('hex');

      await this.prisma.contaAzulAPIConnection.create({
        data: {
          usuarioId: user.id,
          stateCode: id2,
        },
      });

      return `https://api.contaazul.com/auth/authorize?redirect_uri=${scalableRedirectURI}&client_id=${scalableClientId}&scope=sales&state=${id2}`;
    }
  }

  //após o user autorizara a conexão com a Conta Azul, devemos pegar o código passado para nós e gerar o access toke
  //do user para pegar suas informações
  async generateAccessTokenContaAzul(
    data: GenerateAccessTokenContaAzulDTO,
    req: Request,
  ) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower) {
      console.log('apenas users borrowers podem fazer isso');
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });
    }

    console.log(`recebi esse acessToken: ${accessToken}`);
    const scalableClientId = this.contaAzulClientId;
    const scalableClientSecret = this.contaAzulClientSecret;
    //a redirect uri sempre deve ser atualizada na aplicação da scalable da conta azul, também.
    const scalableRedirectURI = this.contaAzulRedirectURI;
    console.log('recebi esse code:');
    console.log(data.code);
    console.log('realizando access token conta azul');
    console.log(
      `https://api.contaazul.com/oauth2/token?grant_type=authorization_code&redirect_uri=${scalableRedirectURI}&code=${data.code}`,
    );
    const scalableClientIdClientSecret = `${scalableClientId}:${scalableClientSecret}`;

    const userContaAzul = await this.prisma.contaAzulAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
        stateCode: data.state,
      },
    });

    if (userContaAzul) {
      const config = {
        method: 'post',
        url: `https://api.contaazul.com/oauth2/token?grant_type=authorization_code&redirect_uri=${scalableRedirectURI}&code=${data.code}`,
        headers: {
          Authorization: `Basic ${Buffer.from(
            scalableClientIdClientSecret,
          ).toString('base64')}`,
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
          'generateAccessTokenContaAzul',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(config),
          `erro em: https://api.contaazul.com/oauth2/token?grant_type=authorization_code&redirect_uri=${scalableRedirectURI}&code=${data.code}`,
          user.id,
        );
        console.log(err);
        throw new BadRequestException('Conta Azul', {
          cause: new Error(),
          description: err,
        });
      }
      console.log('deu certo');
      await this.financeService.getDataFromContaAzul(
        dado.access_token,
        user.id,
      );
      return 'success';
    } else {
      console.log('connection request not found');
      throw new BadRequestException('Conta Azul', {
        cause: new Error(),
        description: 'Connection request not found',
      });
    }
  }

  //criação de conexão entre usuário (borrower) e Omie:
  //o usuário deve passar sua app key e seu app secret da aplicação omie, o resto da integração fica por parte do back.
  async initiateConnectionOmie(data: InitiateConnectionOmieDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const userOmie = await this.prisma.omieAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });
    if (userOmie) {
      await this.prisma.omieAPIConnection.update({
        where: {
          usuarioId: user.id,
        },
        data: {
          appKey: data.appKey,
          appSecret: data.appSecret,
          updateTimestamp: String(Math.round(Date.now() / 1000)),
        },
      });
      await this.financeService.getDataFromOmie(
        data.appKey,
        data.appSecret,
        user.id,
      );
    } else {
      await this.prisma.omieAPIConnection.create({
        data: {
          usuarioId: user.id,
          appKey: data.appKey,
          appSecret: data.appSecret,
          userAddress: user.address,
          updateTimestamp: String(Math.round(Date.now() / 1000)),
        },
      });
      await this.financeService.getDataFromOmie(
        data.appKey,
        data.appSecret,
        user.id,
      );
    }
  }

  //criação de conexão entre usuário (borrower) e Vindi:
  //o usuário deve passar sua chave privada da aplicação Vindi, o resto da integração fica por parte do back.
  async initiateConnectionVindi(
    data: InitiateConnectionVindiDTO,
    req: Request,
  ) {
    console.log('comecando a minha conex');
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const userVindi = await this.prisma.vindiAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });

    if (userVindi) {
      await this.prisma.vindiAPIConnection.update({
        where: {
          usuarioId: user.id,
        },
        data: {
          appPrivateKey: data.appPrivateKey,
          updateTimestamp: String(Math.round(Date.now() / 1000)),
        },
      });
      await this.financeService.getDataFromVindi(data.appPrivateKey, user.id);
    } else {
      await this.prisma.vindiAPIConnection.create({
        data: {
          usuarioId: user.id,
          appPrivateKey: data.appPrivateKey,
          updateTimestamp: String(Math.round(Date.now() / 1000)),
        },
      });
      await this.financeService.getDataFromVindi(data.appPrivateKey, user.id);
    }
  }

  //criação de conexão entre usuário (borrower) e o seu google analytics:
  //usuário deve passar o id de seu app no google analytics.
  async initiateConnectionGoogleAnalytics(data: any, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

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
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${data.appId}`,
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
      });
      console.log('Report result:');
      response.rows.forEach((row) => {
        console.log(row.dimensionValues[0], row.metricValues[0]);
      });
      const isUserGoogleAnalytics =
        await this.prisma.googleAnalyticsAPIConnection.findFirst({
          where: {
            usuarioId: user.id,
          },
        });
      if (isUserGoogleAnalytics) {
        await this.prisma.googleAnalyticsAPIConnection.update({
          where: {
            usuarioId: user.id,
          },
          data: {
            appId: data.appId,
            isUpdated: true,
            updateTimestamp: String(Math.round(Date.now() / 1000)),
          },
        });
      } else {
        await this.prisma.googleAnalyticsAPIConnection.create({
          data: {
            appId: data.appId,
            usuarioId: user.id,
            isUpdated: true,
            updateTimestamp: String(Math.round(Date.now() / 1000)),
          },
        });
      }
    } catch (err) {
      throw new BadRequestException('Connection error', {
        cause: new Error(),
        description:
          'Impossible to connect with google api, review your api key',
      });
    }
  }

  //puxa-se a informação do usuário:
  //deve ser passado o itemId que se conseguiu por meio da conexão com o widget.
  async pullPluggy(data: PullPluggyDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    console.log('recebi sim');
    console.log(data);

    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });
    const userPluggy = await this.prisma.pluggyAPIConnection.findMany({
      where: {
        usuarioId: user.id,
      },
    });

    //Pegando informações básicas sobre o itemId
    const dataAuth = {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    };
    const configAPI = {
      method: 'post',
      url: `https://api.pluggy.ai/auth`,
      headers: {
        accept: 'application/json',
      },
      data: dataAuth,
    };
    let dadoAPI;
    try {
      await axios(configAPI).then(function (response) {
        dadoAPI = response.data.apiKey;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'pullPluggy',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        user.id,
      );
      console.log(err);
      throw new BadRequestException('Pluggy', {
        cause: new Error(),
        description: err,
      });
    }

    const configAccount = {
      method: 'get',
      url: `https://api.pluggy.ai/items/${data.itemId}`,
      headers: {
        'X-API-KEY': dadoAPI,
        accept: 'application/json',
      },
    };
    //vamos pegar o conector id para ver se já existe algum.
    let dadoConnectorId;
    let dadoConnectorName;
    try {
      await axios(configAccount).then(function (response) {
        dadoConnectorId = response.data.connector.id;
        dadoConnectorName = response.data.connector.name;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'pullPluggy',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        user.id,
      );
      console.log(err);
      throw new BadRequestException('Pluggy', {
        cause: new Error(),
        description: err,
      });
    }

    const configAccountNumber = {
      method: 'get',
      url: `https://api.pluggy.ai/accounts?itemId=${data.itemId}`,
      headers: {
        'X-API-KEY': dadoAPI,
        accept: 'application/json',
      },
    };
    let dadoContaBancariaId;
    try {
      await axios(configAccountNumber).then(function (response) {
        dadoContaBancariaId = response.data.results;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'pullPluggy',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAccountNumber),
        undefined,
        user.id,
      );
      console.log(err);
      throw new BadRequestException('Pluggy', {
        cause: new Error(),
        description: err,
      });
    }

    const dadoContaBancariaIdArray = [];
    if (dadoContaBancariaId.length > 0) {
      for (let i = 0; i < dadoContaBancariaId.length; i++) {
        dadoContaBancariaIdArray.push(dadoContaBancariaId[i].number);
      }
    }

    if (userPluggy.length > 0) {
      const existsPluggyWithConnectorId =
        await this.prisma.pluggyAPIConnection.findMany({
          where: {
            usuarioId: user.id,
            connectorId: String(dadoConnectorId),
          },
        });
      //se existe, vamos ver se existe com a mesma conta bancária, se sim, atualizamos a conexão.
      if (existsPluggyWithConnectorId.length > 0) {
        //agora vamos iterar pelos numeros bancarios para ver se algum bate, se bater atualizamos ele com esses dados novos.
        for (let i = 0; i < existsPluggyWithConnectorId.length; i++) {
          const itemEncontrado = existsPluggyWithConnectorId[
            i
          ].accountNumber.some((item) =>
            dadoContaBancariaIdArray.includes(item),
          );
          if (itemEncontrado) {
            await this.financeService.getDataFromPluggy(
              data.itemId,
              user.id,
              existsPluggyWithConnectorId[i].id,
            );
            return;
          }
        }
      }
      const newPluggy = await this.prisma.pluggyAPIConnection.create({
        data: {
          usuarioId: user.id,
          connectorName: dadoConnectorName,
          accountNumber: dadoContaBancariaIdArray,
          connectorId: String(dadoConnectorId),
          itemId: data.itemId,
          updateTimestamp: String(Math.round(Date.now() / 1000)),
        },
      });
      await this.financeService.getDataFromPluggy(
        data.itemId,
        user.id,
        newPluggy.id,
      );
    } else {
      const newPluggy = await this.prisma.pluggyAPIConnection.create({
        data: {
          usuarioId: user.id,
          connectorName: dadoConnectorName,
          accountNumber: dadoContaBancariaIdArray,
          connectorId: String(dadoConnectorId),
          itemId: data.itemId,
          updateTimestamp: String(Math.round(Date.now() / 1000)),
        },
      });
      await this.financeService.getDataFromPluggy(
        data.itemId,
        user.id,
        newPluggy.id,
      );
    }
  }

  //inicia a conexão com o usuário com a a pluggy:
  //retorna o connectToken que o front deve passar ao widget para iniciar a conexão.
  async initiateConnectionPluggy(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });
    const dados = {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    };
    const configAPI = {
      method: 'post',
      url: `https://api.pluggy.ai/auth`,
      headers: {
        accept: 'application/json',
      },
      data: dados,
    };
    let dadoAPI;
    try {
      await axios(configAPI).then(function (response) {
        dadoAPI = response.data.apiKey;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'initiateConnectionPluggy',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        user.id,
      );
      console.log(err);
      throw new BadRequestException('Pluggy', {
        cause: new Error(),
        description: err,
      });
    }

    const config = {
      method: 'post',
      url: `https://api.pluggy.ai/connect_token`,
      headers: {
        accept: 'application/json',
        'X-API-KEY': dadoAPI,
      },
    };
    let dado;
    try {
      await axios(config).then(function (response) {
        dado = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'initiateConnectionPluggy',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(config),
        undefined,
        user.id,
      );
      console.log(err);
      throw new BadRequestException('Pluggy', {
        cause: new Error(),
        description: err,
      });
    }

    return dado;
  }

  //**FUNÇÕES */

  async verifySessionToken(accessToken: string) {
    let user;
    try {
      const tokenValido = await this.jwtService.verifyAsync(accessToken);
      user = await this.prisma.usuario.findFirst({
        where: {
          id: tokenValido.id,
        },
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Invalid session token', {
        cause: new Error(),
        description: 'Invalid session token',
      });
    }
    return user;
  }

  //função para esperar x milisegundos até prosseguir o código:
  async wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
