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
  ApiBody,
} from '@nestjs/swagger';

import { extname } from 'path';

import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

import { Request } from 'express';

import { CNABManagerService } from './cnabManager.service';
import { validate } from 'class-validator';
import { CreateCNABDTO, CreateCNABDTOArray } from './dto/create-cnab.dto';

@ApiTags(
  'CNAB - Criação de arquivos CNAB para geração de garantias-duplicatas.',
)
@Controller('functions')
export class CNABManagerController {
  constructor(private readonly cnabManagerService: CNABManagerService) {}
  apiTokenKey = process.env.API_TOKEN_KEY;

  @ApiOperation({
    summary:
      'Admin - Cria um arquivo CNAB - retornando um objeto contendo o nome do arquivo e seu buffer.',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('createCNAB')
  createCNAB(@Body() data: CreateCNABDTOArray, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.cnabManagerService.create(data, req);
  }
}
