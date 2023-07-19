import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { ApiOperation, ApiTags, ApiHeader } from '@nestjs/swagger';

import { Request } from 'express';

import { OpenFinanceService } from './openFinance.service';

import { FinanceService } from '../internalFunctions/finance.service';

import { GoogleSheetsService } from '../internalFunctions/googleSheets.service';
import { GenerateAccessTokenContaAzulDTO } from './dto/generate-access-token-conta-azul.dto';
import { InitiateConnectionOmieDTO } from './dto/initiate-connection-omie.dto';
import { InitiateConnectionVindiDTO } from './dto/initiate-connection-vindi.dto';
import { PullPluggyDTO } from './dto/pull-pluggy.dto';

@ApiTags(
  'OpenFinance - Conexão de apps openfinance do usuário para retrair métricas financeiras.',
)
@Controller('functions')
export class OpenFinanceController {
  constructor(
    private readonly openFinanceService: OpenFinanceService,
    private readonly financeService: FinanceService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}
  apiTokenKey = process.env.API_TOKEN_KEY;
  scalableSignature = process.env.SCALABLE_SIGNATURE;

  @ApiOperation({
    summary: 'Inicia o fluxo de conexão ao Netsuite do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('initiateConnectionNetsuiteCodat')
  initiateConnectionNetsuiteCodat(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.openFinanceService.initiateConnectionNetsuiteCodat(req);
  }

  @ApiOperation({
    summary: 'Retrai informações financeiras da conta Netsuite do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('pullDataNetsuiteCodat')
  pullDataNetsuiteCodat(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.openFinanceService.pullDataNetsuiteCodat(req);
  }

  @ApiOperation({
    description:
      'Inicia o processo de conexão com a plataforma Conta Azul do borrower. retorna o link que deve ser apresentado ao usuário para ele realizar a integração.',
    summary:
      'Inicia o fluxo de conexão à Conta Azul do usuário - retorna um link em que o usuário deverá acessar para autorizar o compartilhamento de informações',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('initiateConnectionContaAzul')
  initiateConnectionContaAzul(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.openFinanceService.initiateConnectionContaAzul(req);
  }

  @ApiOperation({
    description:
      'Após o usuário dar os “confirma” e fazer a integração com a scalable, ele será redirecionado para uma página scalable (pre-setada por nós), a url será acompanhada do parâmetro “code” e “state”, que deverão ser passados no body do endpoint /generateAccessTokenContaAzul para confirmar a integração com o user. A realização da integração é assíncrona, então poderá demorar alguns minutos até todos os dados do usuário serem capturados pela scalable.A página que o usuário será redirecionado será:[https://www.scalable.com.br/dashboard/tomadores/contaAzulConnection](https://www.scalable.com.br/dashboard/tomadores/?from=contaAzulConnection)essa url será acrescentada do state e do code, exemplo:https://www.scalable.com.br/dashboard/tomadores/contaAzulConnection/?code=jP73BFMXDpXXTavj4TQ3Q9AcxM9GZoLp&state=f72308003c61764d1a02a6a15eaf61d2O front deve ser setado para, toda vez que o user entrar nessa url, chamar esse endpoint passando o code e o state.',
    summary:
      'Gera o token de acesso para retrair informações do usuário da Conta Azul',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('generateAccessTokenContaAzul')
  generateAccessTokenContaAzul(
    @Body() data: GenerateAccessTokenContaAzulDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.openFinanceService.generateAccessTokenContaAzul(data, req);
  }

  @ApiOperation({
    summary: 'Inicia o fluxo de conexão ao Omie do usuário',
    description:
      'Inicia o processo de conexão com a plataforma Omie do borrower. O usuário deve passar sua app key e seu app secret da aplicação omie, o resto da integração fica por parte do back. Este endpoint também serve se o user, por algum motivo, quiser atualizar sua app key e app secret. Se uma das credenciais estiver incorreta, o endpoint retornará um erro.',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('initiateConnectionOmie')
  initiateConnectionOmie(
    @Body() data: InitiateConnectionOmieDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.openFinanceService.initiateConnectionOmie(data, req);
  }

  @ApiOperation({
    summary: 'Inicia o fluxo de conexão ao Vindi do usuário',
    description:
      'Inicia o processo de conexão com a plataforma Vindi do borrower. O usuário deve passar sua app private key da aplicação vindi, o resto da integração fica por parte do back. Este endpoint também serve se o user, por algum motivo, quiser atualizar app private key. Se uma das credenciais estiver incorreta, o endpoint retornará um erro.',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('initiateConnectionVindi')
  initiateConnectionVindi(
    @Body() data: InitiateConnectionVindiDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.openFinanceService.initiateConnectionVindi(data, req);
  }

  @ApiOperation({
    description:
      'Inicia o processo de pull após o usuário ter se conectado com sucesso com a pluggy(deve ser passado o itemId que retorna na sdk)',
    summary: 'Retrai informações open-finance do usuário pela pluggy - pluggy',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('pullPluggy')
  pullPluggy(@Body() data: PullPluggyDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.openFinanceService.pullPluggy(data, req);
  }

  @ApiOperation({
    description:
      'Inicia o processo de conexão com o pluggy do borrower. retorna o connect token que deve ser passado na sdk para o usuário realizar a integração.',
    summary: 'Inicia o fluxo de conexão ao open-finance Pluggy do user',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('initiateConnectionPluggy')
  initiateConnectionPluggy(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.openFinanceService.initiateConnectionPluggy(req);
  }

  @ApiOperation({
    summary: 'Inicia o fluxo de conexão ao google analytics do user',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('initiateConnectionGoogleAnalytics')
  initiateConnectionGoogleAnalytics(
    @Body()
    data: any,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.openFinanceService.initiateConnectionGoogleAnalytics(data, req);
  }
}
