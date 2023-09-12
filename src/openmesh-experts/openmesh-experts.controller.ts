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

import { OpenmeshExpertsService } from './openmesh-experts.service';

@ApiTags(
  'Openmesh-experts - Companies / individuals that qualify to become an openmesh expert endpoints.',
)
@Controller('openmesh-experts/functions')
export class OpenmeshExpertsController {
  constructor(
    private readonly openmeshExpertsService: OpenmeshExpertsService,
  ) {}

  apiTokenKey = process.env.API_TOKEN_KEY;
  deeplinkSignature = process.env.DEEPLINK_TEAM_SIGNATURE;

  //Returns all the departaments
  @ApiOperation({
    summary: 'Returns all the departaments',
  })
  @ApiHeader({
    name: 'x-deeeplink-team-signature',
    description: 'Endpoint only available for deeplink team',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200 })
  @Post('getDepartaments')
  getDepartaments(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
  }
}
