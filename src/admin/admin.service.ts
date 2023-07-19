import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ethers } from 'ethers';
import { SimpleCrypto } from 'simple-crypto-js';

import { PrismaService } from '../database/prisma.service';

import erc20ABI from '../auth/contract/erc20.json';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Request, response } from 'express';
import axios from 'axios';
import { AuthService } from 'src/auth/auth.service';
import { EmailSenderService } from '../internalFunctions/emailSender.service';
import { CreateAdminUserDTO } from './dto/create-admin-user.dto';
import { GetUserDTO } from './dto/get-user.dto';
import { CreateStatsFinanceiroUserDTO } from './dto/create-stats-financeiro-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly emailSenderService: EmailSenderService,
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
  //Endpoints de utilidade ao admin.

  async getUsers(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const users = await this.prisma.usuario.findMany();
    const usersFinal = [];

    if (users) {
      for (let i = 0; i < users.length; i++) {
        if (users[i].emailConfirmado && !users[i].isAdmin) {
          const userReturn = {
            id: users[i].id,
            email: users[i].email,
            nome: users[i].nome,
            sobrenome: users[i].sobrenome,
            timestampContaCriada: users[i].timestampContaCriada,
            emailConfirmado: users[i].emailConfirmado,
            accountVerified: users[i].accountVerified,
            verified2FA: users[i].verified2FA,
            use2FA: users[i].use2FA,
            createdAt: users[i].criadoEm,
            nomeEmpresa: users[i].nomeEmpresa,
            arr: users[i].arr,
            runway: users[i].runway,
            CNPJ: users[i].cnpj,
            isBorrower: true,
            tipoNegocio: users[i].tipoNegocio,
            sobre: users[i].sobre,
          };
          usersFinal.push(userReturn);
        }
      }
    }
    return usersFinal;
  }

  async getUser(data: GetUserDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const userFound = await this.prisma.usuario.findFirst({
      where: {
        id: data.userId,
      },
    });

    if (!userFound) {
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'User not found',
      });
    }
    const userReturn = {
      id: userFound.id,
      email: userFound.email,
      nome: userFound.nome,
      sobrenome: userFound.sobrenome,
      timestampContaCriada: userFound.timestampContaCriada,
      emailConfirmado: userFound.emailConfirmado,
      accountVerified: userFound.accountVerified,
      verified2FA: userFound.verified2FA,
      use2FA: userFound.use2FA,
      createdAt: userFound.criadoEm,
      atualizadoEm: userFound.atualizadoEm,
      nomeEmpresa: userFound.nomeEmpresa,
      CNPJ: userFound.cnpj,
      arr: userFound.arr,
      runway: userFound.runway,
      isBorrower: true,
      tipoNegocio: userFound.tipoNegocio,
      arquivosUpload: [],
      ultimaModificacaoArquivosUpload: null,
      financialStats: [],
      operacoesCredito: [],
      propostasCredito: [],
      sobre: userFound.sobre,
    };

    //vendo se ele possui arquivos que fez uploads:
    const arquivosFound = await this.prisma.arquivosUploadUsuario.findFirst({
      where: {
        usuarioId: data.userId,
      },
    });
    if (arquivosFound) {
      if (arquivosFound.outrosFiles.length > 0) {
        const finalArquivos = [];
        for (let i = 0; i < arquivosFound.outrosFiles.length; i++) {
          const myFile = `https://storage.cloud.google.com/storage-files-scalable/${arquivosFound.outrosFiles[i]}?authuser=6`;
          finalArquivos.push(myFile);
        }
        userReturn.arquivosUpload = finalArquivos;
      }
      userReturn.ultimaModificacaoArquivosUpload = arquivosFound.atualizadoEm;
    }
    const tipos = [
      'subscricoesFiles',
      'bancarioFiles',
      'contabilFiles',
      'outrosFiles',
      'balancoPatrimonial',
      'dre',
      'demonstracaoDeFluxoDeCaixa',
      'declaracaoFaturamentoUltimos12Meses',
      'orcamentoAnualEProjecao',
      'relatorioMetricasFinanceirasEOperacionais',
      'historicoDeCredito',
      'contratosClientesEFornecedores',
    ];
    const finalArquivos = [];
    tipos.map((tipo) => {
      if (arquivosFound) {
        if (arquivosFound[tipo]) {
          for (let i = 0; i < arquivosFound[tipo].length; i++) {
            const myFile = `https://storage.cloud.google.com/storage-files-scalable/${arquivosFound[tipo][i]}?authuser=6`;
            finalArquivos.push(myFile);
          }
        }
      }
    });
    userReturn.arquivosUpload = finalArquivos;
    if (arquivosFound) {
      userReturn.ultimaModificacaoArquivosUpload = arquivosFound.atualizadoEm;
    }

    //vendo se ele possui o financial stats:
    const financialStats = await this.prisma.statsFinanceiroUsuario.findFirst({
      where: {
        usuarioId: data.userId,
      },
    });
    if (financialStats) {
      userReturn.financialStats.push(financialStats);
    }

    //vendo o seu histórico de propostas de crédito:
    const propostasFound = await this.prisma.propostasCredito.findMany({
      where: {
        usuarioId: data.userId,
      },
    });
    if (propostasFound.length > 0) {
      userReturn.propostasCredito = propostasFound;
    }

    //vendo suas operacoes:
    const operacoesFound = await this.prisma.operacoesCredito.findMany({
      where: {
        usuarioId: data.userId,
      },
    });
    if (operacoesFound.length > 0) {
      userReturn.operacoesCredito = operacoesFound;
    }

    return userReturn;
  }

  //cria uma nova proposta de credito para um user.
  async criarPropostaCredito(data: any, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const userFound = await this.prisma.usuario.findFirst({
      where: {
        id: data.userId,
      },
    });

    if (!userFound) {
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'User not found',
      });
    }

    const novaProposta = await this.prisma.propostasCredito.create({
      data: {
        usuarioId: data.userId,
        montanteProposto: data.montanteProposto,
        taxaJurosProposto: data.taxaJurosProposto,
        termoProposto: data.termoProposto,
      },
    });

    return novaProposta;
  }

  //deleta uma proposta de credito para um user.
  async deletarPropostaCredito(data: any, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    //verificar se existe propostaCredito:
    const propostaFound = await this.prisma.propostasCredito.findFirst({
      where: {
        id: data.propostaId,
      },
    });

    if (!propostaFound) {
      throw new BadRequestException('Proposta', {
        cause: new Error(),
        description: 'Proposta wasnt found',
      });
    }

    await this.prisma.propostasCredito.delete({
      where: {
        id: data.propostaId,
      },
    });
  }

  async getPropostas(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const propostas = await this.prisma.propostasCredito.findMany();
    const propostasFinal = [];

    if (propostas) {
      for (let i = 0; i < propostas.length; i++) {
        const userCNPJ = await this.prisma.usuario.findFirst({
          where: {
            id: propostas[i].usuarioId,
          },
        });
        const propostaReturn = {
          id: propostas[i].id,
          usuarioId: propostas[i].usuarioId,
          CNPJ: userCNPJ.cnpj,
          montanteProposto: propostas[i].montanteProposto,
          taxaJurosProposto: propostas[i].taxaJurosProposto,
          termoProposto: propostas[i].termoProposto,
          montanteRequisitado: propostas[i].montanteRequisitado,
          propostaVisualizada: propostas[i].propostaVisualizada,
          propostaAberta: propostas[i].propostaAberta,
          propostaAceita: propostas[i].propostaAceita,
          criadoEm: propostas[i].criadoEm,
          atualizadoEm: propostas[i].atualizadoEm,
        };
        propostasFinal.push(propostaReturn);
      }
    }
    return propostasFinal;
  }

  async createAdminUser(data: CreateAdminUserDTO) {
    const results = await this.prisma.usuario.findFirst({
      where: {
        email: data.email,
      },
    });
    if (results) {
      //se uma conta já foi criada com esse email e o email não foi confirmado, deletamos essa conta antiga e criamos a nova.
      if (
        results.emailVerificado === false &&
        Number(results.timestampContaCriada) + 86400 <
          Math.round(Date.now() / 1000)
      ) {
        await this.prisma.usuario.delete({
          where: {
            email: data.email,
          },
        });
      }
      //se uma conta com esse email já foi criada em menos de 24 horas, não deixamos ele criar outra.
      else if (
        results.emailVerificado === false &&
        Number(results.timestampContaCriada) + 86400 >=
          Math.round(Date.now() / 1000)
      ) {
        throw new BadRequestException(
          'Email already registered but not confirmed yet (wait 24 hours to try to register another account within this mail)',
          {
            cause: new Error(),
            description:
              'Email already registered but not confirmed yet (wait 24 hours to try to register another account within this mail)',
          },
        );
      }
      //se o email já está em uso:
      else if (results.emailVerificado === true) {
        throw new BadRequestException('Email already in use', {
          cause: new Error(),
          description: 'Email already in use',
        });
      }
    }

    const tantumResponse = await this.criarWalletTatum();
    const cipherEth = this.simpleCryptoJs.encrypt(tantumResponse.walletId);

    //gerando password:
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const id = crypto.randomBytes(16);
    const id2 = id.toString('hex');

    const response = await this.prisma.usuario.create({
      data: {
        email: data.email,
        sobrenome: data.sobrenome,
        password: hashedPassword,
        emailConfirmado: true,
        emailVerificado: true,
        nome: data.nome,
        timestampContaCriada: String(Math.round(Date.now() / 1000)),
        hashConfirmarEmail: id2,
        address: tantumResponse.address,
        tantumId: cipherEth,
        isAdmin: true,
      },
    });

    const jwt = await this.jwtService.signAsync({ id: response.id });

    const userFinalReturn = {
      email: response.email,
      nome: response.nome,
      sobrenome: response.sobrenome,
      timestampContaCriada: response.timestampContaCriada,
      address: response.address,
      emailConfirmado: true,
      accountVerified: true,
      sessionToken: jwt,
      createdAt: response.criadoEm,
      isAdmin: true,
    };

    await this.emailSenderService.emailNovoUserADM(
      response.email,
      response.nome,
    );

    return userFinalReturn;
  }

  //Cria um statsFinanceiro para o usuário - eles são acumulativos, então se quiser mudar algum stats do user, deve-se criar um novo, pois assim o antigo ficará no histórico dele e
  //será possível traçar uma linha de evolução.
  async createStatsFinanceiroUser(
    dataBody: CreateStatsFinanceiroUserDTO,
    req: Request,
  ) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const stats = await this.prisma.statsFinanceiroUsuario.create({
      data: {
        usuarioId: dataBody.usuarioId,
        grossMargin: String(dataBody.grossMargin),
        debtRevenueRatio: String(dataBody.debtRevenueRatio),
        arpu: String(dataBody.arpu),
        arrGrowthYoY: String(dataBody.arrGrowthYoY),
        churn: String(dataBody.churn),
        ltvCAC: String(dataBody.ltvCAC),
        runway: String(dataBody.runway),
      },
    });

    return stats;
  }

  async loginUser(data: LoginUserDTO) {
    const user = await this.prisma.usuario.findFirst({
      where: {
        email: data.email,
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid username/password.', {
        cause: new Error(),
        description: 'Invalid username/password.',
      });
    }
    const operacoesFound = await this.prisma.operacoesCredito.findMany({
      where: {
        usuarioId: user.id,
        aberto: true,
      },
    });

    const jwt = await this.jwtService.signAsync({ id: user.id });

    const userFinalReturn = {
      email: user.email,
      nome: user.nome,
      sobrenome: user.sobrenome,
      timestampContaCriada: user.timestampContaCriada,
      address: user.address,
      usdcAmount: user.usdcAmount,
      emailConfirmado: user.emailConfirmado,
      accountVerified: user.accountVerified,
      verified2FA: user.verified2FA,
      use2FA: user.use2FA,
      sessionToken: jwt,
      balance: 0,
      createdAt: user.criadoEm,
      nomeEmpresa: user.nomeEmpresa,
      CNPJ: user.cnpj,
      isBorrower: user.isBorrower,
      tipoNegocio: user.tipoNegocio,
      possuiOperacoesCreditoOn: operacoesFound ? true : false,
      isAdmin: user.isAdmin,
      sobre: user.sobre,
    };
    return userFinalReturn;
  }

  async criarWalletTatum() {
    const id = crypto.randomBytes(32);
    const id2 = id.toString('hex');
    const privateKey = '0x' + id2;

    const wallet = new ethers.Wallet(privateKey);
    const final = {
      address: wallet.address,
      walletId: privateKey,
    };

    return final;
  }

  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
