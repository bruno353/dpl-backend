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

import { OpenmeshDataService } from './openmesh-data.service';
import {
  ChangePasswordOpenmeshExpertUserDTO,
  ConfirmEmailDTO,
  CreateOpenmeshExpertUserDTO,
  EmailRecoverPasswordDTO,
  LoginDTO,
  LoginResponseDTO,
  RecoverPasswordDTO,
  RecoverPasswordIsValidDTO,
  UpdateOpenmeshExpertUserDTO,
} from './dto/openmesh-experts-auth.dto';

@ApiTags(
  'Openmesh-experts - Companies / individuals that qualify to become an openmesh expert endpoints.',
)
@Controller('openmesh-data/functions')
export class OpenmeshDataController {
  constructor(private readonly openmeshDataService: OpenmeshDataService) {}

  apiTokenKey = process.env.API_TOKEN_KEY;
  deeplinkSignature = process.env.DEEPLINK_TEAM_SIGNATURE;

  @ApiOperation({
    summary: 'Create an openmesh user',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('getDatasets')
  getDatasets(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.openmeshDataService.getDatasets();
  }
}
