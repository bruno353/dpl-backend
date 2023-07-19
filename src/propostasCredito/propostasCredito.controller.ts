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
} from '@nestjs/swagger';

import { extname } from 'path';

import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

import { Request } from 'express';

import { PropostasCreditoService } from './propostasCredito.service';

import { validate } from 'class-validator';
import { CriarPropostaCreditoDTO } from './dto/criar-proposta-credito.dto';
import { DeletarPropostaCreditoDTO } from './dto/deletar-proposta-credito.dto';
import { GetPropostaDTO } from './dto/get-proposta.dto';

@ApiTags(
  'Propostas de crédito - Criação e gerenciamento de propostas de crédito para um usuário',
)
@Controller('functions')
export class PropostasCreditoController {
  constructor(
    private readonly propostasCreditoService: PropostasCreditoService,
  ) {}
  apiTokenKey = process.env.API_TOKEN_KEY;

  @ApiOperation({
    summary: 'Admin - Cadastra uma proposta de crédito para um usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('criarPropostaCredito')
  criarPropostaCredito(
    @Body() data: CriarPropostaCreditoDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.propostasCreditoService.criarPropostaCredito(data, req);
  }

  @ApiOperation({
    summary: 'Admin - Deleta uma proposta de crédito de um usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('deletarPropostaCredito')
  deletarPropostaCredito(
    @Body() data: DeletarPropostaCreditoDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.propostasCreditoService.deletarPropostaCredito(data, req);
  }

  @ApiOperation({
    summary: 'Admin - Retorna todas as propostas de crédito da plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getPropostas')
  getPropostas(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.propostasCreditoService.getPropostas(req);
  }

  @ApiOperation({
    summary: 'Admin - Retorna informações de uma proposta em específico',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getProposta')
  getProposta(@Body() data: GetPropostaDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.propostasCreditoService.getProposta(data, req);
  }

  @ApiOperation({
    summary: 'Retorna as propostas de crédito ativas de um usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getPropostaCreditoOn')
  getPropostaCreditoOn(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.propostasCreditoService.getPropostaCreditoOn(req);
  }

  @ApiOperation({
    summary: 'Retorna as propostas de crédito abertas de um usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getPropostaCreditoAberta')
  getPropostaCreditoAberta(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.propostasCreditoService.getPropostaCreditoAberta(req);
  }

  @ApiOperation({
    summary:
      'Informa o backend que uma mensagem de nova proposta de crédito foi mostrada ao usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('propostaCreditoNovaMensagem')
  propostaCreditoNovaMensagem(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.propostasCreditoService.propostaCreditoNovaMensagem(req);
  }

  @ApiOperation({
    summary:
      'Informa o backend que uma proposta de crédito foi visualizada pelo usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('propostaCreditoVisualizada')
  propostaCreditoVisualizada(
    @Body() data: GetPropostaDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.propostasCreditoService.propostaCreditoVisualizada(data, req);
  }

  @ApiOperation({
    summary:
      'Realiza o upload dos contratos de clientes de um usuário referente a uma proposta de crédito',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('uploadFilesPropostaCredito')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFilesPropostaCredito(
    @Body()
    data: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (files.length === 0) {
      throw new BadRequestException('Files not found', {
        cause: new Error(),
        description: 'Files not found',
      });
    }
    if (files.length > 25) {
      throw new BadRequestException('Upload exceeds 25 files', {
        cause: new Error(),
        description: 'Upload exceeds 25 files',
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
    return this.propostasCreditoService.uploadFilesPropostaCredito(
      data,
      files,
      req,
    );
  }
}
