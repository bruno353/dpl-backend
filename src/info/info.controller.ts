import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiHeader,
} from '@nestjs/swagger';

import { Request } from 'express';

import { InfoService } from './info.service';

@ApiTags('Info - Endpoints relacionados a informações de um usuário')
@Controller('functions')
export class InfoController {
  constructor(private readonly infoService: InfoService) {}
  apiTokenKey = process.env.API_TOKEN_KEY;

  @ApiOperation({
    summary: 'Deprecated',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getEmpresas')
  getEmpresas(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.infoService.getEmpresas();
  }

  @ApiOperation({
    summary: 'Retorna o status das conexões do usuário com o openfinance',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('bankingAPIsStatus')
  bankingAPIsStatus(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.infoService.bankingAPIsStatus(req);
  }

  @ApiOperation({
    summary:
      'Retorna as métricas financeiras do usuário baseado nas suas conexões com o openfinance',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getFinanceData')
  getFinanceData(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.infoService.getFinanceData(req);
  }
}
