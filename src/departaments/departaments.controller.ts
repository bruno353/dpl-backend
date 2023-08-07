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

import { DepartamentsService } from './departaments.service';
import { GetDepartamentsResponseDto } from './dto/departaments.dto';

@ApiTags('Tasks - Getting tasks on-chain; metadata and events')
@Controller('functions')
export class DepartamentsController {
  constructor(private readonly departamentsService: DepartamentsService) {}

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
  @ApiResponse({ status: 200, type: GetDepartamentsResponseDto })
  @Post('getDepartaments')
  getDepartaments(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.departamentsService.getDepartaments();
  }
}
