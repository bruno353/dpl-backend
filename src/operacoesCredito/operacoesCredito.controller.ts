import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiHeader,
  ApiConsumes,
} from '@nestjs/swagger';

import { extname } from 'path';

import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

import { Request } from 'express';

import { CedentesCreditoService } from './cedentesCredito.service';
import { OperacoesCreditoService } from './operacoesCredito.service';
import { validate } from 'class-validator';

import { CreateCedenteDTO } from './dto/create-cedente.dto';
import { CreateOperacaoDTO } from './dto/create-operacao.dto';
import { CreateRepresentanteLegalCedenteDTO } from './dto/create-representante-legal-cedente.dto';
import { CreateContaBancariaDTO } from './dto/create-conta-bancaria.dto';
import { CreateDadosAssinaturaCedenteDTO } from './dto/create-dados-assinatura.dto';
import { GetOperacaoDTO, GetOperacaoScalableDTO } from './dto/get-operacao.dto';
import { UploadDocumentoCedenteDTO } from './dto/upload-documento-cedente.dto';
import { UploadDocumentoRepresentanteLegalDTO } from './dto/upload-documento-representante-legal.dto';
import { UploadDocumentoSocioJuridicoDTO } from './dto/upload-documento-socio-juridico.dto';
import { UploadDocumentoSocioFisicoDTO } from './dto/upload-documento-socio-fisico.dto';
import { ActivateOperacaoDTO } from './dto/activate-operacao.dto';
import { CreateSocioJuridicoCedenteDTO } from './dto/create-socio-juridico-cedente.dto';
import { CreateSocioFisicoCedenteDTO } from './dto/create-socio-fisico-cedente.dto';
import { PatchQuadroSocietarioDTO } from './dto/patch-quadro-societario.dto';
import { RegisterOperacaoDTO } from './dto/register-operacao.dto';
import { AttCCBOperacaoDTO } from './dto/atualizar-ccb-operacao.dto';
import { GetCCBFileBufferDTO } from './dto/get-ccb-file-buffer.dto';
import { UpdatePagamentoOperacao } from './dto/update-pagamento-operacao.dto';

@ApiTags(
  'Operações de crédito - Criação de cedentes e operações de crédito pela plataforma Sigma-Scalable.',
)
@Controller('functions')
export class OperacoesCreditoController {
  constructor(
    private readonly cedentesCreditoService: CedentesCreditoService,
    private readonly operacoesCreditoService: OperacoesCreditoService,
  ) {}
  apiTokenKey = process.env.API_TOKEN_KEY;

  @ApiOperation({
    summary: 'Admin - Retorna informações sobre o cedente',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getCedente')
  getCedente(@Body() data: any, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cedentesCreditoService.getCedente(data, req);
  }

  @ApiOperation({
    summary: 'Admin - Retorna todos os cedentes cadastrados na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getCedentes')
  getCedentes(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cedentesCreditoService.getCedentes(req);
  }

  @ApiOperation({
    summary:
      'Admin - Função temporária que será usada para retornar todos os usuários - estando cadastrados na SRM ou não - por conta da não funcionamento da api da srm.',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getCedentesNoSRM')
  getCedentesNoSRM(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cedentesCreditoService.getCedentesNoSRM(req);
  }

  @ApiOperation({
    summary:
      'Admin - Retorna todos os usuários da plataforma que atualmente não cadastrados como cedentes',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getNonCedentesUsers')
  getNonCedentesUsers(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cedentesCreditoService.getNonCedentesUsers(req);
  }

  @ApiOperation({
    summary: 'Admin - Cria um cedente na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('createCedente')
  createCedente(@Body() data: CreateCedenteDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cedentesCreditoService.createCedente(data, req);
  }

  @ApiOperation({
    summary:
      'Admin - Cadastra um representante legal de um cedente na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('createRepresentanteLegalCedente')
  createRepresentanteLegalCedente(
    @Body() data: CreateRepresentanteLegalCedenteDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cedentesCreditoService.createRepresentanteLegalCedente(
      data,
      req,
    );
  }

  @ApiOperation({
    summary:
      'Admin - Cadastra um sócio pessoa-jurídica de um cedente na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('createSocioJuridicoCedente')
  createSocioJuridicoCedente(
    @Body() data: CreateSocioJuridicoCedenteDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cedentesCreditoService.createSocioJuridicoCedente(data, req);
  }

  @ApiOperation({
    summary:
      'Admin - Cadastra um sócio pessoa-física de um cedente na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('createSocioFisicoCedente')
  createSocioFisicoCedente(
    @Body() data: CreateSocioFisicoCedenteDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cedentesCreditoService.createSocioFisicoCedente(data, req);
  }

  @ApiOperation({
    summary:
      'Admin - Cadastra os dados de assinatura de um cedente na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('createDadosAssinaturaCedente')
  createDadosAssinaturaCedente(
    @Body() data: CreateDadosAssinaturaCedenteDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cedentesCreditoService.createDadosAssinaturaCedente(data, req);
  }

  @ApiOperation({
    summary: 'Admin - Atualiza o quadro societário de um cedente na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('patchQuadroSocietario')
  patchQuadroSocietario(
    @Body() data: PatchQuadroSocietarioDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cedentesCreditoService.patchQuadroSocietario(data, req);
  }

  @ApiOperation({
    summary: 'Admin - Cadastra uma conta corrente de um cedente na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('createContaCorrenteCedente')
  createContaCorrenteCedente(
    @Body() data: CreateContaBancariaDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cedentesCreditoService.createContaCorrenteCedente(data, req);
  }

  @ApiOperation({
    summary: 'Admin - Faz o upload de um documento de um cedente na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('uploadDocumentoCedente')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadDocumentoCedente(
    @Body()
    data: UploadDocumentoCedenteDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (files.length != 1) {
      throw new BadRequestException('1 file per time', {
        cause: new Error(),
        description: '1 file per time',
      });
    }
    const maxFileSize = 20 * 1024 * 1024; // 20 MB
    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'pdf',
      'xlsx',
      'csv',
      'txt',
      'docx',
      'json',
    ];
    const promises = files.map(async (file) => {
      const validationErrors = await validate(file, {
        validationError: { target: false },
      });
      if (validationErrors.length > 0) {
        throw new BadRequestException(validationErrors);
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} is too large, maximum allowed size is ${
            maxFileSize / 1024 / 1024
          } MB`,
        );
      }
      const fileExtension = extname(file.originalname).substring(1);
      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        throw new BadRequestException(
          'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf, xlsx, csv, txt, docx, json',
        );
      }
    });

    await Promise.all(promises);
    return this.cedentesCreditoService.uploadDocumentoCedente(data, files, req);
  }

  @ApiOperation({
    summary:
      'Admin - Faz o upload de um documento de um representante legal de um cedente na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('uploadDocumentoRepresentanteLegal')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadDocumentoRepresentanteLegal(
    @Body()
    data: UploadDocumentoRepresentanteLegalDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (files.length != 1) {
      throw new BadRequestException('1 file per time', {
        cause: new Error(),
        description: '1 file per time',
      });
    }
    const maxFileSize = 20 * 1024 * 1024; // 20 MB
    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'pdf',
      'xlsx',
      'csv',
      'txt',
      'docx',
      'json',
    ];
    const promises = files.map(async (file) => {
      const validationErrors = await validate(file, {
        validationError: { target: false },
      });
      if (validationErrors.length > 0) {
        throw new BadRequestException(validationErrors);
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} is too large, maximum allowed size is ${
            maxFileSize / 1024 / 1024
          } MB`,
        );
      }
      const fileExtension = extname(file.originalname).substring(1);
      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        throw new BadRequestException(
          'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf, xlsx, csv, txt, docx, json',
        );
      }
    });

    await Promise.all(promises);
    return this.cedentesCreditoService.uploadDocumentoRepresentanteLegal(
      data,
      files,
      req,
    );
  }

  @ApiOperation({
    summary:
      'Admin - Faz o upload de um documento de um sócio pessoa-jurídica de um cedente na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('uploadDocumentoSocioJuridico')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadDocumentoSocioJuridico(
    @Body()
    data: UploadDocumentoSocioJuridicoDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (files.length != 1) {
      throw new BadRequestException('1 file per time', {
        cause: new Error(),
        description: '1 file per time',
      });
    }
    const maxFileSize = 20 * 1024 * 1024; // 20 MB
    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'pdf',
      'xlsx',
      'csv',
      'txt',
      'docx',
      'json',
    ];
    const promises = files.map(async (file) => {
      const validationErrors = await validate(file, {
        validationError: { target: false },
      });
      if (validationErrors.length > 0) {
        throw new BadRequestException(validationErrors);
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} is too large, maximum allowed size is ${
            maxFileSize / 1024 / 1024
          } MB`,
        );
      }
      const fileExtension = extname(file.originalname).substring(1);
      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        throw new BadRequestException(
          'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf, xlsx, csv, txt, docx, json',
        );
      }
    });

    await Promise.all(promises);
    return this.cedentesCreditoService.uploadDocumentoSocioJuridico(
      data,
      files,
      req,
    );
  }

  @ApiOperation({
    summary:
      'Admin - Faz o upload de um documento de um sócio pessoa-física de um cedente na plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('uploadDocumentoSocioFisico')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadDocumentoSocioFisico(
    @Body()
    data: UploadDocumentoSocioFisicoDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (files.length != 1) {
      throw new BadRequestException('1 file per time', {
        cause: new Error(),
        description: '1 file per time',
      });
    }
    const maxFileSize = 20 * 1024 * 1024; // 20 MB
    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'pdf',
      'xlsx',
      'csv',
      'txt',
      'docx',
      'json',
    ];
    const promises = files.map(async (file) => {
      const validationErrors = await validate(file, {
        validationError: { target: false },
      });
      if (validationErrors.length > 0) {
        throw new BadRequestException(validationErrors);
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} is too large, maximum allowed size is ${
            maxFileSize / 1024 / 1024
          } MB`,
        );
      }
      const fileExtension = extname(file.originalname).substring(1);
      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        throw new BadRequestException(
          'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf, xlsx, csv, txt, docx, json',
        );
      }
    });

    await Promise.all(promises);
    return this.cedentesCreditoService.uploadDocumentoSocioFisico(
      data,
      files,
      req,
    );
  }

  //OPERAÇÕES ENDPOINTS:
  @ApiOperation({
    summary: 'Admin - Retorna as operações de crédito da plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getOperacoes')
  getOperacoes(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.operacoesCreditoService.getOperacoes(req);
  }

  @ApiOperation({
    summary: 'Retorna todas as operações de crédito ativas de um usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getOperacoesUserOn')
  getOperacoesUserOn(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.operacoesCreditoService.getOperacoesUserOn(req);
  }

  @ApiOperation({
    summary:
      'Faz um update de algum pagamento da operacao - enviando se o pagamento foi feito ou não',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('updatePagamentoOperacao')
  updatePagamentoOperacao(
    @Body() data: UpdatePagamentoOperacao,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.operacoesCreditoService.updatePagamentoOperacao(data, req);
  }

  @ApiOperation({
    summary:
      'Admin - Retorna informações de uma operação de crédito específica',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getOperacaoSigma')
  getOperacaoSigma(@Body() data: GetOperacaoDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.operacoesCreditoService.getOperacaoSigma(data, req);
  }

  @ApiOperation({
    summary:
      'Admin - Retorna informações de uma operação de crédito específica da plataforma Scalable (nao fazendo chamadas na api da SRM)',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getOperacao')
  getOperacao(@Body() data: GetOperacaoScalableDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.operacoesCreditoService.getOperacao(data, req);
  }

  @ApiOperation({
    summary: 'Admin - Cadastra uma operação de crédito',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('createOperacao')
  createOperacao(@Body() data: CreateOperacaoDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.operacoesCreditoService.createOperacao(data, req);
  }

  @ApiOperation({
    summary:
      'Admin - Registra uma operação de crédito ativa na plataforma Scalable que já foi criada na plataforma Sigma - SRM',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('registerOperacao')
  registerOperacao(@Body() data: RegisterOperacaoDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.operacoesCreditoService.registerOperacao(data, req);
  }

  @ApiOperation({
    summary:
      'Admin - Faz o upload do ccb da operação - se existe algum arquivo antigo ele será apagado',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('attCCBOperacao')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async attCCBOperacao(
    @Body()
    data: AttCCBOperacaoDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (files.length != 1) {
      throw new BadRequestException('1 file per time', {
        cause: new Error(),
        description: '1 file per time',
      });
    }
    const maxFileSize = 20 * 1024 * 1024; // 20 MB
    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'pdf',
      'xlsx',
      'csv',
      'txt',
      'docx',
      'json',
    ];
    const promises = files.map(async (file) => {
      const validationErrors = await validate(file, {
        validationError: { target: false },
      });
      if (validationErrors.length > 0) {
        throw new BadRequestException(validationErrors);
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} is too large, maximum allowed size is ${
            maxFileSize / 1024 / 1024
          } MB`,
        );
      }
      const fileExtension = extname(file.originalname).substring(1);
      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        throw new BadRequestException(
          'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf, xlsx, csv, txt, docx, json',
        );
      }
    });

    await Promise.all(promises);
    return this.operacoesCreditoService.attCCBOperacao(data, files, req);
  }

  @ApiOperation({
    summary: 'Retorna o buffer do arquivo ccb que está anexado à operação',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getCCBOperacaoBuffer')
  getCCBOperacaoBuffer(@Body() data: GetCCBFileBufferDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.operacoesCreditoService.getCCBOperacaoBuffer(data, req);
  }

  @ApiOperation({
    summary: 'Admin - Torna uma operação de crédito ativa',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('activateOperacao')
  activateOperacao(@Body() data: ActivateOperacaoDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.operacoesCreditoService.activateOperacao(data, req);
  }

  @Post('webhookSRM')
  webhookSRM(@Body() data: any, @Req() req: Request) {
    // const apiToken = String(req.headers['x-parse-application-id']);
    // if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.operacoesCreditoService.webhookSRM(data, req);
  }
}
