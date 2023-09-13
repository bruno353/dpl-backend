import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Get,
  Req,
  UnauthorizedException,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiTags,
  ApiHeader,
  ApiBody,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';

import { Request } from 'express';

import { OpenmeshExpertsAuthService } from './openmesh-experts-auth.service';
import {
  CreateOpenmeshExpertUserDTO,
  LoginDTO,
  LoginResponseDTO,
} from './dto/openmesh-experts-auth.dto';

@ApiTags(
  'Openmesh-experts - Companies / individuals that qualify to become an openmesh expert endpoints.',
)
@Controller('openmesh-experts/functions')
export class OpenmeshExpertsController {
  constructor(
    private readonly openmeshExpertsAuthService: OpenmeshExpertsAuthService,
  ) {}

  apiTokenKey = process.env.API_TOKEN_KEY;
  deeplinkSignature = process.env.DEEPLINK_TEAM_SIGNATURE;

  @ApiOperation({
    summary: 'Create an openmesh user',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('createUser')
  createUser(@Body() data: CreateOpenmeshExpertUserDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.openmeshExpertsAuthService.createUser(data);
  }

  @ApiOperation({
    summary: 'Login an openmesh user',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: LoginResponseDTO })
  @Post('login')
  login(@Body() data: LoginDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.openmeshExpertsAuthService.login(data);
  }

  @ApiOperation({
    summary: 'validateRecaptcha from google',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('validateRecaptcha')
  @ApiResponse({ status: 200, type: Boolean })
  validateRecaptcha(@Body() data: any, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.openmeshExpertsAuthService.validateRecaptcha(data);
  }

  @ApiOperation({
    summary: 'Return user info',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'oken mandatory to connect with the app',
  })
  @Post('getCurrentUser')
  getCurrentUser(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.openmeshExpertsAuthService.getCurrentUser(req);
  }
}
