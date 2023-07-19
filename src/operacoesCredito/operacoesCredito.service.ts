import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ethers } from 'ethers';
import { SimpleCrypto } from 'simple-crypto-js';
import { join } from 'path';
import { Storage } from '@google-cloud/storage';
import { v4 as uuid } from 'uuid';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import { PrismaService } from '../database/prisma.service';

import { Request, response } from 'express';
import axios from 'axios';
import { GoogleBucketService } from 'src/internalFunctions/googleBucket.service';
import { EmailSenderService } from '../internalFunctions/emailSender.service';
import { AuthService } from 'src/auth/auth.service';
import { LogService } from '../internalFunctions/log.service';
import { CreateRepresentanteLegalCedenteDTO } from './dto/create-representante-legal-cedente.dto';
import { CreateOperacaoDTO } from './dto/create-operacao.dto';
import { GetOperacaoDTO, GetOperacaoScalableDTO } from './dto/get-operacao.dto';
import { ActivateOperacaoDTO } from './dto/activate-operacao.dto';
import { RegisterOperacaoDTO } from './dto/register-operacao.dto';
import { AWSBucketService } from 'src/internalFunctions/awsBucket.service';
import { AttCCBOperacaoDTO } from './dto/atualizar-ccb-operacao.dto';
import { GetCCBFileBufferDTO } from './dto/get-ccb-file-buffer.dto';
import { UpdatePagamentoOperacao } from './dto/update-pagamento-operacao.dto';

@Injectable()
export class OperacoesCreditoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly logService: LogService,
    private readonly awsBucketService: AWSBucketService,
  ) {}
  simpleCryptoJs = new SimpleCrypto(process.env.CIPHER);

  clientIdSRMAPI = process.env.CLIENT_ID_SRM_API;
  passwordSRMAPI = process.env.PASSWORD_SRM_API;
  urlSRMAPI = process.env.URL_SRM_API;

  //**ENDPOINTS:**
  //Service que se comunica com a API da SRM - relacionados ao fluxo de criação de uma operação de crédito.

  //Devolve dados detalhes de uma operacao - deve-se passar o sigmaId dela
  async getOperacaoSigma(dataBody: GetOperacaoDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //chamando a api:
    const configAPI = {
      method: 'get',
      url: `${this.urlSRMAPI}/srm-operation-flow/v1/manter-operacao/v1.0/buscar-operacao/id/${dataBody.operacaoSigmaId}/codigo-operacao-netfactor/0`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
    };

    let operacaoSigma;
    try {
      await axios(configAPI).then(function (response) {
        operacaoSigma = response.data;
      });
    } catch (err) {
      //se devolve 404, o usuario cedente ainda não foi cadastrado.
      this.logService.createErrorLog(
        'getOperacaoSigma',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
      );
      console.log(err);
    }
    return operacaoSigma;
  }

  //Para uma operação ser mostrada para o user, ela precisa ser ativada (após ela ser formalizada e etc. finalmente deve-se chamar esse endpoint para oficiliazar)
  async activateOperacao(dataBody: ActivateOperacaoDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const op = await this.prisma.operacoesCredito.update({
      where: {
        id: dataBody.operacaoId,
      },
      data: {
        aberto: true,
      },
    });

    await this.prisma.propostasCredito.update({
      where: {
        id: op.propostaCreditoId,
      },
      data: {
        operacaoEmAndamento: true,
      },
    });
  }

  //Atualiza o pagamento se ele foi feito ou não.
  async updatePagamentoOperacao(data: UpdatePagamentoOperacao, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const pagamento = await this.prisma.pagamento.findFirst({
      where: {
        id: data.pagamentoId,
      },
    });

    if (!pagamento) {
      throw new BadRequestException('No pagamento found', {
        cause: new Error(),
        description: 'No pagamento found',
      });
    }

    await this.prisma.pagamento.update({
      where: {
        id: data.pagamentoId,
      },
      data: {
        pago: data.pagamentoRealizado,
      },
    });
  }

  //Devolve todas as operacoes criadas na plataforma.
  async getOperacoes(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const operacoes = await this.prisma.operacoesCredito.findMany();

    const operacoesFinal = [];

    if (operacoes) {
      for (let i = 0; i < operacoes.length; i++) {
        const cedente = await this.prisma.usuario.findFirst({
          where: {
            id: operacoes[i].usuarioId,
          },
        });
        operacoes[i]['CNPJCedente'] = cedente.cnpj;
        operacoesFinal.push(operacoes[i]);
      }
    }
    return operacoes;
  }

  //Devolve uma operacao em específico.
  async getOperacao(data: GetOperacaoScalableDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const operacoesFound = await this.prisma.operacoesCredito.findFirst({
      where: {
        id: data.operacaoId,
      },
      include: {
        pagamentos: {
          orderBy: {
            dataVencimento: 'asc',
          },
        },
      },
    });

    if (!operacoesFound) {
      return;
    }
    const cedente = await this.prisma.usuario.findFirst({
      where: {
        id: operacoesFound.usuarioId,
      },
    });
    operacoesFound['CNPJCedente'] = cedente.cnpj;

    return operacoesFound;
  }

  //Devolve todas as operacoes de um user que estão ativas.
  async getOperacoesUserOn(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const operacoesFound = await this.prisma.operacoesCredito.findMany({
      where: {
        usuarioId: user.id,
        aberto: true,
      },
      include: {
        pagamentos: true, // adicione essa linha
      },
      orderBy: {
        criadoEm: 'asc',
      },
    });

    // Iterar sobre cada operação de crédito
    for (const operacao of operacoesFound) {
      // Filtrar os pagamentos que já foram realizados
      const pagamentosFeitos = operacao.pagamentos.filter(
        (pagamento) => pagamento.pago,
      );
      // Calcular o montante total desses pagamentos
      let montanteTotalPago = new Decimal(0);
      for (const pagamento of pagamentosFeitos) {
        montanteTotalPago = montanteTotalPago.plus(
          new Decimal(pagamento.montante),
        );
      }
      // Adicionar o montante total pago à operação
      operacao['montanteTotalPago'] = montanteTotalPago.toString();
    }

    const response = {
      operacoes: operacoesFound,
    };

    const statsFinanceiro = await this.prisma.statsFinanceiroUsuario.findFirst({
      where: {
        usuarioId: user.id,
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });
    if (statsFinanceiro) {
      //calcular aqui a média:
      // Convertendo os valores para Decimal e calculando a soma
      const grossMargin = new Decimal(statsFinanceiro.grossMargin);
      const debtRevenueRatio = new Decimal(statsFinanceiro.debtRevenueRatio);
      const runway = new Decimal(statsFinanceiro.runway);
      const ltvCAC = new Decimal(statsFinanceiro.ltvCAC);
      const arpu = new Decimal(statsFinanceiro.arpu);
      const arrGrowthYoY = new Decimal(statsFinanceiro.arrGrowthYoY);
      const churn = new Decimal(statsFinanceiro.churn);

      const sum = grossMargin
        .plus(debtRevenueRatio)
        .plus(runway)
        .plus(ltvCAC)
        .plus(arpu)
        .plus(arrGrowthYoY)
        .plus(churn);

      // Calculando a média dividindo a soma pelo número de propriedades
      const average = sum.dividedBy(7);
      statsFinanceiro['scoreGeral'] = average;
      response['statsFinanceiro'] = statsFinanceiro;
    }

    return response;
  }

  //Registrar uma operação de crédito na plataforma Scalable que já foi criada na plataforma Sigma - SRM
  async registerOperacao(dataBody: RegisterOperacaoDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const operacaoExiste = await this.prisma.operacoesCredito.findFirst({
      where: {
        sigmaId: dataBody.sigmaId,
      },
    });
    if (operacaoExiste)
      throw new BadRequestException(
        'Already exists operacao credito with this sigmaId',
        {
          cause: new Error(),
          description: 'Already exists operacao credito with this sigmaId',
        },
      );

    const operacao = await this.prisma.operacoesCredito.create({
      data: {
        montante: String(dataBody.valorSolicitadoValor),
        taxaJuros: String(dataBody.taxaJurosValor),
        termo: String(dataBody.quantidadeParcelasValor),
        usuarioId: dataBody.usuarioId,
        propostaCreditoId: dataBody.propostaCreditoId,
        sigmaId: dataBody.sigmaId,
        pagamentos: {
          create: dataBody.pagamentos.map((pagamento) => ({
            dataVencimento: new Date(pagamento.dataVencimento),
            montante: String(pagamento.montante),
          })),
        },
        aberto: true,
      },
    });

    return operacao;

    //Após isso, deve ser fechado todas as propostas de crédito em aberto.
  }

  //Faz o upload do ccb da operação - se existe algum arquivo antigo ele será apagado
  async attCCBOperacao(
    dataBody: AttCCBOperacaoDTO,
    files: Array<Express.Multer.File>,
    req: Request,
  ) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const operacaoExiste = await this.prisma.operacoesCredito.findFirst({
      where: {
        id: dataBody.operacaoCreditoId,
      },
    });
    if (!operacaoExiste)
      throw new BadRequestException('This operacao do not exist', {
        cause: new Error(),
        description: 'This operacao do not exist',
      });

    //se já existir um arquivo, apagar ele
    if (operacaoExiste.ccbFile.length > 0) {
      await this.awsBucketService.deleteFileBucket(operacaoExiste.ccbFile[0]);
    }

    let urlFile = '';
    if (files.length > 0) {
      console.log('File found, trying to upload...');
      let fileName = '';
      try {
        fileName = `${uuid()}-${files[0].originalname}`;
        //verifica se esse id já existe, se retornar um erro é pq não existe, e assim dá para prosseguir:
        const thisNameUUIDAlreadyExist =
          await this.awsBucketService.verifyIfFileExists(fileName);
        if (thisNameUUIDAlreadyExist)
          throw new BadRequestException('Upload erro', {
            cause: new Error(),
          });
        // await this.googleBucketService.uploadFileBucket(fileName, file);
        await this.awsBucketService.uploadFileBucket(fileName, files[0]);
      } catch (err) {
        this.logService.createErrorLog(
          'uploadFiles',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(fileName),
          undefined,
          user.id,
        );
        console.log(err);
        throw new BadRequestException('Upload erro', {
          cause: new Error(),
          description: err,
        });
      }
      urlFile = `${fileName}`; //url:https://storage.cloud.google.com/${bucket.name}/${fileName}?authuser=6
    }
    const operacao = await this.prisma.operacoesCredito.update({
      where: {
        id: dataBody.operacaoCreditoId,
      },
      data: {
        ccbFile: [urlFile],
      },
    });

    return operacao;

    //Após isso, deve ser fechado todas as propostas de crédito em aberto.
  }

  //Retorna o buffer do arquivo ccb que está anexado à operação
  async getCCBOperacaoBuffer(
    data: GetCCBFileBufferDTO,
    req: Request,
  ): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.authService.verifySessionToken(accessToken);

    //apenas user admin ou o user cedente da operacao podem ver esta informacao:
    if (!user.isAdmin) {
      const opExisteUser = await this.prisma.operacoesCredito.findFirst({
        where: {
          id: data.operacaoCreditoId,
          usuarioId: user.id,
        },
      });
      if (!opExisteUser) {
        throw new BadRequestException('User', {
          cause: new Error(),
          description:
            'Only admin or the user of the operation can do this request',
        });
      }
    }

    const op = await this.prisma.operacoesCredito.findFirst({
      where: {
        id: data.operacaoCreditoId,
      },
    });

    if (!op) {
      throw new BadRequestException('Operacao do not exist', {
        cause: new Error(),
        description: 'Operacao do not exist',
      });
    }
    console.log(op);
    console.log(op.ccbFile[0]);

    const res = await this.awsBucketService.getFileBuffer(op.ccbFile[0]);
    return res;
  }

  //Fluxo de criação uma operação de crédito - SRM
  async createOperacao(dataBody: CreateOperacaoDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    //pegando o cnpj limpo do user.
    const userEmpresa = await this.prisma.usuario.findFirst({
      where: {
        id: dataBody.usuarioId,
      },
    });
    if (!userEmpresa)
      throw new BadRequestException('User not found', {
        cause: new Error(),
        description: 'User empresa not found',
      });

    const cnpj = userEmpresa.cnpj.replace(/[^\d]+/g, '');
    const cpfGerente = user.adminGerenteCPF.replace(/[^\d]+/g, '');

    //verificando se foi passado corretamente uma proposta de credito id:
    const propostaCredito = await this.prisma.propostasCredito.findFirst({
      where: {
        id: dataBody.propostaCreditoId,
        usuarioId: dataBody.usuarioId,
      },
    });
    if (!propostaCredito)
      throw new BadRequestException('Proposta de credito not found', {
        cause: new Error(),
        description: 'Proposta de crédito not found',
      });

    const operacaoExiste = await this.prisma.operacoesCredito.findFirst({
      where: {
        propostaCreditoId: dataBody.propostaCreditoId,
      },
    });
    if (operacaoExiste)
      throw new BadRequestException(
        'Already exists operacao credito with this propostaCreditoId',
        {
          cause: new Error(),
          description:
            'Already exists operacao credito with this propostaCreditoId',
        },
      );

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //parametro usuarioId não é passado para a API da SRM:
    const { usuarioId, propostaCreditoId, ...dataFinal } = dataBody;

    //começando o fluxo de chamadas da API SRM:

    // 1 - incluirOperacaoEmprestimo :
    const data = {
      cedenteIdentificador: cnpj,
      gerenteIdentificador: cpfGerente,
      produtoSigla: 'KGFIN',
      tipoInclusaoChave: 'MANUAL',
      ...dataFinal,
    };
    const operacao = await this.incluirOperacaoEmprestimo(
      data,
      accessTokenSRM,
      userEmpresa,
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(operacao);

    // 2 - finalizarAnaliseOperacaoEmprestimo:
    const data2 = {
      operacaoId: operacao['alterado']['nfOperacao']['opeCodigo'],
      cedenteIdentificador: cnpj,
      modulo: 'ANALISE_OPERACAO',
    };
    await this.finalizarAnaliseOperacaoEmprestimo(
      data2,
      accessTokenSRM,
      userEmpresa,
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3 - autorizarOperacaoEmprestimo:
    const data3 = {
      operacaoId: operacao['alterado']['nfOperacao']['opeCodigo'],
      cedenteIdentificador: cnpj,
    };
    await this.autorizarOperacaoEmprestimo(data3, accessTokenSRM, userEmpresa);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 4 - formalizarOperacaoEmprestimo:
    try {
      await this.formalizarOperacaoEmprestimo(
        data3,
        accessTokenSRM,
        userEmpresa,
      );
    } catch (err) {}
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 5 - efetivarOperacaoEmprestimo:
    try {
      await this.efetivarOperacaoEmprestimo(data3, accessTokenSRM, userEmpresa);
    } catch (err) {}

    //salvando operacao na db:
    await this.prisma.operacoesCredito.create({
      data: {
        sigmaId: String(operacao['alterado']['nfOperacao']['opeCodigo']),
        montante: String(dataBody.valorSolicitadoValor),
        taxaJuros: String(dataBody.taxaJurosValor),
        termo: String(dataBody.quantidadeParcelasValor),
        usuarioId: usuarioId,
        propostaCreditoId: propostaCreditoId,
      },
    });

    //fechando as propostas de crédito que estavam abertas:
    await this.prisma.propostasCredito.updateMany({
      where: {
        usuarioId: usuarioId,
        propostaAberta: true,
      },
      data: {
        propostaAberta: false,
      },
    });

    return operacao;
  }

  //FUNÇÕES:
  async generateAccessTokenSRMAPI() {
    const data = {
      grant_type: 'client_credentials',
    };
    const configAPI = {
      method: 'post',
      url: `https://api.wefin.com.br/oauth/access-token`,
      auth: {
        username: this.clientIdSRMAPI,
        password: this.passwordSRMAPI,
      },
      headers: {
        accept: 'application/json',
      },
      data: data,
    };

    let retornoAPIAccessToken: string;
    try {
      await axios(configAPI).then(function (response) {
        retornoAPIAccessToken = response.data.access_token;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'generateAccessTokenSRMAPI',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
      );
      console.log(err);
      throw new BadRequestException('Access token', {
        cause: new Error(),
        description: 'Access token',
      });
    }
    return retornoAPIAccessToken;
  }

  async incluirOperacaoEmprestimo(
    data: any,
    accessToken: string,
    userEmpresa: any,
  ) {
    console.log('incluindo operacao de emprestimo');
    console.log(data);
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/srm-operation-flow/v1/manter-operacao/v1.0/incluir-operacao-emprestimo`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessToken,
      },
      data,
    };

    let operacao;
    try {
      await axios(configAPI).then(function (response) {
        operacao = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'incluirOperacaoEmprestimo',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log('algum erro ocorreu!!!');
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return operacao;
  }

  async finalizarAnaliseOperacaoEmprestimo(
    data: any,
    accessToken: string,
    userEmpresa: any,
  ) {
    console.log('finalizando análise operação empréstimo');
    console.log(data);
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/srm-operation-flow/v1/analisar-operacao/v1.0/finalizar-analise-operacao-emprestimo`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessToken,
      },
      data,
    };

    let analise;
    try {
      await axios(configAPI).then(function (response) {
        analise = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'finalizarAnaliseOperacaoEmprestimo',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log('algum erro ocorreu!!!');
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return analise;
  }

  async autorizarOperacaoEmprestimo(
    data: any,
    accessToken: string,
    userEmpresa: any,
  ) {
    console.log('autorizando operação empréstimo');
    console.log(data);
    const configAPI = {
      method: 'put',
      url: `${this.urlSRMAPI}/srm-operation-flow/v1/autorizar-operacao/v1.0`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessToken,
      },
      data,
    };

    let autorizar;
    try {
      await axios(configAPI).then(function (response) {
        autorizar = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'autorizarOperacaoEmprestimo',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log('algum erro ocorreu!!!');
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return autorizar;
  }

  async formalizarOperacaoEmprestimo(
    data: any,
    accessToken: string,
    userEmpresa: any,
  ) {
    console.log('formalizando operação empréstimo');
    console.log(data);
    const configAPI = {
      method: 'put',
      url: `${this.urlSRMAPI}/srm-operation-flow/v1/formalizar-operacao/v1.0/formalizar-operacao-emprestimo`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessToken,
      },
      data,
    };

    let formalizar;
    try {
      await axios(configAPI).then(function (response) {
        formalizar = response.data;
      });
    } catch (err) {
      console.log('algum erro ocorreu');
      this.logService.createErrorLog(
        'formalizarOperacaoEmprestimo',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return formalizar;
  }

  async efetivarOperacaoEmprestimo(
    data: any,
    accessToken: string,
    userEmpresa: any,
  ) {
    console.log('efetivando operação empréstimo');
    console.log(data);
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/srm-operation-flow/v1/efetivar-operacao/v1.0/efetivar-operacao-emprestimo`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessToken,
      },
      data,
    };

    let efetivar;
    try {
      await axios(configAPI).then(function (response) {
        efetivar = response.data;
      });
    } catch (err) {
      console.log('algum erro ocorreu');
      this.logService.createErrorLog(
        'efetivarOperacaoEmprestimo',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return efetivar;
  }

  async webhookSRM(data: any, req: Request) {
    console.log('logando req webhook srm');
    console.log(req);
    console.log('logando data webhook srm');
    console.log(data);
    console.log('logando o ip');
    JSON.stringify(req.headers['x-forwarded-for']);
  }
  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
