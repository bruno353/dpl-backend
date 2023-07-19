import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ethers } from 'ethers';
import { SimpleCrypto } from 'simple-crypto-js';
import { join } from 'path';
import { Storage } from '@google-cloud/storage';
import { v4 as uuid } from 'uuid';
import { createReadStream } from 'fs';
import * as streamifier from 'streamifier';
import * as FormData from 'form-data';
import { Readable } from 'stream';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import { PrismaService } from '../database/prisma.service';

import { Request, response } from 'express';
import axios from 'axios';
import { GoogleBucketService } from 'src/internalFunctions/googleBucket.service';
import { EmailSenderService } from '../internalFunctions/emailSender.service';
import { AuthService } from 'src/auth/auth.service';
import { LogService } from '../internalFunctions/log.service';
import { CreateCedenteDTO } from './dto/create-cedente.dto';
import { CreateRepresentanteLegalCedenteDTO } from './dto/create-representante-legal-cedente.dto';
import { CreateContaBancariaDTO } from './dto/create-conta-bancaria.dto';
import { CreateDadosAssinaturaCedenteDTO } from './dto/create-dados-assinatura.dto';
import { UploadDocumentoRepresentanteLegalDTO } from './dto/upload-documento-representante-legal.dto';
import { UploadDocumentoCedenteDTO } from './dto/upload-documento-cedente.dto';
import { UploadDocumentoSocioFisicoDTO } from './dto/upload-documento-socio-fisico.dto';
import { UploadDocumentoSocioJuridicoDTO } from './dto/upload-documento-socio-juridico.dto';
import { CreateSocioJuridicoCedenteDTO } from './dto/create-socio-juridico-cedente.dto';
import { CreateSocioFisicoCedenteDTO } from './dto/create-socio-fisico-cedente.dto';
import { PatchQuadroSocietarioDTO } from './dto/patch-quadro-societario.dto';

@Injectable()
export class CedentesCreditoService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly googleBucketService: GoogleBucketService,
    private readonly emailSenderService: EmailSenderService,
    private readonly authService: AuthService,
    private readonly logService: LogService,
  ) {}
  simpleCryptoJs = new SimpleCrypto(process.env.CIPHER);

  clientIdSRMAPI = process.env.CLIENT_ID_SRM_API;
  passwordSRMAPI = process.env.PASSWORD_SRM_API;
  urlSRMAPI = process.env.URL_SRM_API;

  //**ENDPOINTS:**
  //Service que se comunica com a API da SRM - relacionados ao fluxo de dados do cedente-user.

  //Procura se o user já está cadastrado como cedente na SRM, se sim, devolve os dados dele, se não, devolve um array vazio.
  //Além disso, procura também os documentos cadastrados nesse cedente e suas operações.
  async getCedente(dataBody: any, req: Request) {
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
    if (!userEmpresa.cedenteSRM)
      throw new BadRequestException('User not registered as cedente yet', {
        cause: new Error(),
        description: 'User not registered as cedente yet',
      });

    const cnpj = userEmpresa.cnpj.replace(/[^\d]+/g, '');

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    const cedente = [];
    //chamando a api:
    const configAPI = {
      method: 'get',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
    };

    let cedenteData = {};
    try {
      await axios(configAPI).then(function (response) {
        cedenteData = response.data;
      });
    } catch (err) {
      //se devolve 404, o usuario cedente ainda não foi cadastrado.
      this.logService.createErrorLog(
        'getCedente',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
      );
      console.log(err);
    }

    //chamando API para retornar os documentos:
    const configAPI2 = {
      method: 'get',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/documentos`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
    };

    let documentoData: any = {};
    try {
      await axios(configAPI2).then(function (response) {
        documentoData = response.data;
        const { socios, representantesLegais, ...rest } = documentoData;

        if (socios) {
          rest.sociosDocumento = socios;
        }

        if (representantesLegais) {
          rest.representantesLegaisDocumentos = representantesLegais;
        }

        documentoData = rest;
      });
    } catch (err) {
      //se devolve 404, o usuario cedente ainda não foi cadastrado.
      this.logService.createErrorLog(
        'getCedente',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
      );
      console.log(err);
    }

    //chamando API para retornar os dados de assinatura:
    const configAPI3 = {
      method: 'get',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/dados-assinatura`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
    };

    let dadosAssinatura = {};
    try {
      await axios(configAPI3).then(function (response) {
        dadosAssinatura = response.data;
      });
    } catch (err) {
      //se devolve 404, o usuario cedente ainda não foi cadastrado.
      this.logService.createErrorLog(
        'getCedenteDadosAssinatura',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
      );
      console.log(err);
    }
    const dataAssinaturaFormatted = { dadosAssinatura };

    //devolvendo também dados do user na plataforma scalable - formatado:
    const userScalable = await this.getUserInfo(userEmpresa.id);
    const userReturn = { userScalable };
    cedente.push({
      ...userReturn,
      ...documentoData,
      ...cedenteData,
      ...dataAssinaturaFormatted,
    });
    return cedente;
  }

  //Devolve todos os users cadastrados como cedentes na API SRM
  async getCedentes(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const cedentes = await this.prisma.usuario.findMany({
      where: {
        cedenteSRM: true,
      },
    });
    const cedentesFinal = [];

    if (cedentes) {
      for (let i = 0; i < cedentes.length; i++) {
        if (cedentes[i].emailConfirmado && !cedentes[i].isAdmin) {
          const userReturn = {
            id: cedentes[i].id,
            email: cedentes[i].email,
            nome: cedentes[i].nome,
            sobrenome: cedentes[i].sobrenome,
            timestampContaCriada: cedentes[i].timestampContaCriada,
            emailConfirmado: cedentes[i].emailConfirmado,
            accountVerified: cedentes[i].accountVerified,
            verified2FA: cedentes[i].verified2FA,
            use2FA: cedentes[i].use2FA,
            createdAt: cedentes[i].criadoEm,
            nomeEmpresa: cedentes[i].nomeEmpresa,
            arr: cedentes[i].arr,
            runway: cedentes[i].runway,
            CNPJ: cedentes[i].cnpj,
            isBorrower: true,
            tipoNegocio: cedentes[i].tipoNegocio,
            sobre: cedentes[i].sobre,
          };
          cedentesFinal.push(userReturn);
        }
      }
    }
    return cedentesFinal;
  }

  //Função temporária que será usada para retornar todos os usuários - estando cadastrados na SRM ou não - por conta da não funcionamento da api da srm.
  async getCedentesNoSRM(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const cedentes = await this.prisma.usuario.findMany({});
    const cedentesFinal = [];

    if (cedentes) {
      for (let i = 0; i < cedentes.length; i++) {
        if (cedentes[i].emailConfirmado && !cedentes[i].isAdmin) {
          const userReturn = {
            id: cedentes[i].id,
            email: cedentes[i].email,
            nome: cedentes[i].nome,
            sobrenome: cedentes[i].sobrenome,
            timestampContaCriada: cedentes[i].timestampContaCriada,
            emailConfirmado: cedentes[i].emailConfirmado,
            accountVerified: cedentes[i].accountVerified,
            verified2FA: cedentes[i].verified2FA,
            use2FA: cedentes[i].use2FA,
            createdAt: cedentes[i].criadoEm,
            nomeEmpresa: cedentes[i].nomeEmpresa,
            arr: cedentes[i].arr,
            runway: cedentes[i].runway,
            CNPJ: cedentes[i].cnpj,
            isBorrower: true,
            tipoNegocio: cedentes[i].tipoNegocio,
            sobre: cedentes[i].sobre,
          };
          cedentesFinal.push(userReturn);
        }
      }
    }
    return cedentesFinal;
  }

  //Devolve todos os users que ainda não foram cadastrados como cedente na SRM API
  async getNonCedentesUsers(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const cedentes = await this.prisma.usuario.findMany({
      where: {
        cedenteSRM: false,
      },
    });
    const cedentesFinal = [];

    if (cedentes) {
      for (let i = 0; i < cedentes.length; i++) {
        if (cedentes[i].emailConfirmado && !cedentes[i].isAdmin) {
          const userReturn = {
            id: cedentes[i].id,
            email: cedentes[i].email,
            nome: cedentes[i].nome,
            sobrenome: cedentes[i].sobrenome,
            timestampContaCriada: cedentes[i].timestampContaCriada,
            emailConfirmado: cedentes[i].emailConfirmado,
            accountVerified: cedentes[i].accountVerified,
            verified2FA: cedentes[i].verified2FA,
            use2FA: cedentes[i].use2FA,
            createdAt: cedentes[i].criadoEm,
            nomeEmpresa: cedentes[i].nomeEmpresa,
            arr: cedentes[i].arr,
            runway: cedentes[i].runway,
            CNPJ: cedentes[i].cnpj,
            isBorrower: true,
            tipoNegocio: cedentes[i].tipoNegocio,
            sobre: cedentes[i].sobre,
          };
          cedentesFinal.push(userReturn);
        }
      }
    }
    return cedentesFinal;
  }

  //Cadastra um user como cedente na api da SRM.
  async createCedente(dataBody: CreateCedenteDTO, req: Request) {
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

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    const data = {
      identificadorCedente: cnpj,
      identificadorGerente: cpfGerente,
      faturamentoAnual: dataBody.faturamentoAnual,
      codigoRamoAtividade: dataBody.codigoRamoAtividade,
    };

    //chamando a api:
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
      data,
    };

    let cedente;
    try {
      await axios(configAPI).then(function (response) {
        cedente = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'createCedente',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }

    await this.prisma.usuario.update({
      where: {
        id: userEmpresa.id,
      },
      data: {
        cedenteSRM: true,
      },
    });

    return cedente;
  }

  //cadastra os representantes legais do cedente-user
  async createRepresentanteLegalCedente(
    dataBody: CreateRepresentanteLegalCedenteDTO,
    req: Request,
  ) {
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

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //parametro usuarioId não é passado para a API da SRM:
    const { usuarioId, ...dataFinal } = dataBody;

    const data = {
      cargo: 'SOCIO',
      ...dataFinal,
    };
    //chamando a api:
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/representantes-legais`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
      data,
    };

    let representanteLegal;
    try {
      await axios(configAPI).then(function (response) {
        representanteLegal = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'createRepresentanteLegalCedente',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return representanteLegal;
  }

  //cadastra um socio juridico do cedente-user
  async createSocioJuridicoCedente(
    dataBody: CreateSocioJuridicoCedenteDTO,
    req: Request,
  ) {
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

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //parametro usuarioId não é passado para a API da SRM:
    const { usuarioId, ...dataFinal } = dataBody;

    const data = {
      ...dataFinal,
    };
    //chamando a api:
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/socios-pessoa-juridica`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
      data,
    };

    let socio;
    try {
      await axios(configAPI).then(function (response) {
        socio = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'createSocioJuridicoCedente',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return socio;
  }

  //atualiza o quadro societário de um cedente
  async patchQuadroSocietario(
    dataBody: PatchQuadroSocietarioDTO,
    req: Request,
  ) {
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

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //parametro usuarioId não é passado para a API da SRM:
    const { usuarioId, ...dataFinal } = dataBody;

    const data = {
      ...dataFinal,
    };
    console.log('enviando esse data');
    console.log(data);
    //chamando a api:
    const configAPI = {
      method: 'put',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/quadro-societario`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
      data,
    };

    let res;
    try {
      await axios(configAPI).then(function (response) {
        res = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'createSocioJuridicoCedente',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return res;
  }

  //cadastra um socio fisico do cedente-user
  async createSocioFisicoCedente(
    dataBody: CreateSocioFisicoCedenteDTO,
    req: Request,
  ) {
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

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //parametro usuarioId não é passado para a API da SRM:
    const { usuarioId, ...dataFinal } = dataBody;

    const data = {
      cargo: 'SOCIO',
      ...dataFinal,
    };

    //chamando a api:
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/socios-pessoa-fisica`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
      data,
    };

    let socio;
    try {
      await axios(configAPI).then(function (response) {
        socio = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'createSocioFisicoCedente',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return socio;
  }

  //faz upload de um documento do cedente-user
  async uploadDocumentoCedente(
    dataBody: UploadDocumentoCedenteDTO,
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

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //criando o form:
    console.log('preparando o forms');
    const formData = new FormData();
    formData.append('tipo-documento', dataBody.tipoDocumento);
    formData.append('file', Readable.from(files[0].buffer), {
      filename: files[0].originalname,
    });

    //chamando a api:
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/documentos`,
      headers: {
        accept: 'multipart/form-data',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
      data: formData,
    };

    let file;
    try {
      await axios(configAPI).then(function (response) {
        file = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'uploadDocumentoCedente',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log(err);
      throw new BadRequestException(err, {
        cause: new Error(),
        description: err,
      });
    }
    return file;
  }

  //faz upload de um documento do representante-legal-cedente
  async uploadDocumentoRepresentanteLegal(
    dataBody: UploadDocumentoRepresentanteLegalDTO,
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

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //criando o form:
    console.log('preparando o forms');
    const formData = new FormData();
    formData.append('tipo-documento', dataBody.tipoDocumento);
    formData.append('file', Readable.from(files[0].buffer), {
      filename: files[0].originalname,
    });

    //pegando id limpo do representante:
    const idR = dataBody.representanteLegalId.replace(/[^\d]+/g, '');

    //chamando a api:
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/representantes-legais/${idR}/documentos`,
      headers: {
        accept: 'multipart/form-data',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
      data: formData,
    };

    let file;
    try {
      await axios(configAPI).then(function (response) {
        file = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'uploadDocumentoRepresentanteLegal',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return file;
  }

  //faz upload de um documento do socio pessoa física do cedente
  async uploadDocumentoSocioFisico(
    dataBody: UploadDocumentoSocioFisicoDTO,
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

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //criando o form:
    console.log('preparando o forms');
    const formData = new FormData();
    formData.append('tipo-documento', dataBody.tipoDocumento);
    formData.append('file', Readable.from(files[0].buffer), {
      filename: files[0].originalname,
    });

    //pegando id limpo do socio:
    const idS = dataBody.socioId.replace(/[^\d]+/g, '');

    //chamando a api:
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/socios-pessoa-fisica/${idS}/documentos`,
      headers: {
        accept: 'multipart/form-data',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
      data: formData,
    };

    let file;
    try {
      await axios(configAPI).then(function (response) {
        file = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'uploadDocumentoRepresentanteLegal',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return file;
  }

  //faz upload de um documento do socio pessoa jurídica do cedente
  async uploadDocumentoSocioJuridico(
    dataBody: UploadDocumentoSocioJuridicoDTO,
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

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //criando o form:
    console.log('preparando o forms');
    const formData = new FormData();
    formData.append('tipo-documento', dataBody.tipoDocumento);
    formData.append('file', Readable.from(files[0].buffer), {
      filename: files[0].originalname,
    });

    //pegando id limpo do socio:
    const idS = dataBody.socioId.replace(/[^\d]+/g, '');

    //chamando a api:
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/socios-pessoa-juridica/${idS}/documentos`,
      headers: {
        accept: 'multipart/form-data',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
      data: formData,
    };

    let file;
    try {
      await axios(configAPI).then(function (response) {
        file = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'uploadDocumentoRepresentanteLegal',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return file;
  }

  //cadastra conta corrente para o cedente
  async createContaCorrenteCedente(
    dataBody: CreateContaBancariaDTO,
    req: Request,
  ) {
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

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //parametro usuarioId não é passado para a API da SRM:
    const { usuarioId, ...dataFinal } = dataBody;

    const data = {
      ...dataFinal,
    };
    //chamando a api:
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/contas-corrente`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
      data,
    };

    let contaCorrente;
    try {
      await axios(configAPI).then(function (response) {
        contaCorrente = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'createContaCorrenteCedente',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return contaCorrente;
  }

  //cadastra os dados de assinatura dos representantes legais do cedente-user
  async createDadosAssinaturaCedente(
    dataBody: CreateDadosAssinaturaCedenteDTO,
    req: Request,
  ) {
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

    //pegando o access token da SRM API:
    const accessTokenSRM = await this.generateAccessTokenSRMAPI();

    //parametro usuarioId não é passado para a API da SRM:
    const { usuarioId, ...dataFinal } = dataBody;

    const data = {
      ...dataFinal,
    };
    data.representantesLegais = data.representantesLegais.map(
      (representante) => {
        return {
          identificadorRepresentante: representante.identificadorRepresentante,
          email: representante.email,
          tipoAssinatura: representante?.['dadosAssinatura'].tipoAssinatura,
          dataValidadeAssinatura:
            representante?.['dadosAssinatura'].dataValidadeAssinatura,
          possuiCertificadoDigital:
            representante?.['dadosAssinatura'].possuiCertificadoDigital,
        };
      },
    );
    //chamando a api:
    const configAPI = {
      method: 'post',
      url: `${this.urlSRMAPI}/cadastro-cedente/v1/cedentes-pessoa-juridica/${cnpj}/dados-assinatura`,
      headers: {
        accept: 'application/json',
        client_id: this.clientIdSRMAPI,
        access_token: accessTokenSRM,
      },
      data,
    };

    let dadosAssinatura;
    try {
      await axios(configAPI).then(function (response) {
        dadosAssinatura = response.data;
      });
    } catch (err) {
      this.logService.createErrorLog(
        'createDadosAssinaturaCedente',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(configAPI),
        undefined,
        userEmpresa.id,
      );
      console.log(err);
      throw new BadRequestException('Algum erro ocorreu', {
        cause: new Error(),
        description: 'Algum erro ocorreu',
      });
    }
    return dadosAssinatura;
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

  async getUserInfo(userId: string) {
    const userFound = await this.prisma.usuario.findFirst({
      where: {
        id: userId,
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
      propostasCredito: [],
      sobre: userFound.sobre,
    };

    //vendo se ele possui arquivos que fez uploads:
    const arquivosFound = await this.prisma.arquivosUploadUsuario.findFirst({
      where: {
        usuarioId: userId,
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

    //vendo se ele possui o financial stats:
    const financialStats = await this.prisma.statsFinanceiroUsuario.findFirst({
      where: {
        usuarioId: userId,
      },
    });
    if (financialStats) {
      userReturn.financialStats.push(financialStats);
    }

    //vendo o seu histórico de propostas de crédito:
    const propostasFound = await this.prisma.propostasCredito.findMany({
      where: {
        usuarioId: userId,
      },
    });
    if (propostasFound.length > 0) {
      userReturn.propostasCredito = propostasFound;
    }
    console.log('vou retornar esse user');
    console.log(userReturn);
    return userReturn;
  }

  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
