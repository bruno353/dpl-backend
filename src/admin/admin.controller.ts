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

import { AdminService } from './admin.service';
import { CreateAdminUserDTO } from './dto/create-admin-user.dto';
import { GetUserDTO } from './dto/get-user.dto';
import { CreateStatsFinanceiroUserDTO } from './dto/create-stats-financeiro-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';

@ApiTags('Admin - Usuário administrador da plataforma')
@Controller('functions')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  apiTokenKey = process.env.API_TOKEN_KEY;
  scalableSignature = process.env.SCALABLE_SIGNATURE;

  @ApiOperation({
    summary: 'Cria um usuário admin',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('criarUserAdmin')
  createAdminUser(@Body() data: CreateAdminUserDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (String(req.headers['x-scalable-signature']) !== this.scalableSignature)
      throw new UnauthorizedException();
    return this.adminService.createAdminUser(data);
  }

  @ApiOperation({
    summary: 'Loga em uma conta de user',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('loginUser')
  loginUser(@Body() data: LoginUserDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (String(req.headers['x-scalable-signature']) !== this.scalableSignature)
      throw new UnauthorizedException();
    return this.adminService.loginUser(data);
  }

  @ApiOperation({
    summary: 'Retorna todos os users da plataforma',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getUsers')
  getUsers(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.adminService.getUsers(req);
  }

  @ApiOperation({
    summary: 'Retorna informações de um user em específico',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getUser')
  getUser(@Body() data: GetUserDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.adminService.getUser(data, req);
  }

  @ApiOperation({
    summary:
      'Cria o status financeiros do usuário (serão mostrados na interface de operação de crédito)',
    description:
      ' os status financeiros são acumulativos, então se quiser mudar algum stats do user, deve-se criar um novo, pois assim o antigo ficará no histórico dele e será possível traçar uma linha de evolução',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('createStatsFinanceiroUser')
  createStatsFinanceiroUser(
    @Body() data: CreateStatsFinanceiroUserDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.adminService.createStatsFinanceiroUser(data, req);
  }
}
