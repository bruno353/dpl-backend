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
import { UtilsService } from './utils.service';

@ApiTags('Utils')
@Controller('functions')
export class UsersController {
  constructor(private readonly usersService: UtilsService) {}

  apiTokenKey = process.env.API_TOKEN_KEY;
  deeplinkSignature = process.env.DEEPLINK_TEAM_SIGNATURE;

  @ApiOperation({
    summary:
      'Alternative endpoint used to register speaks on the calendly for the conference/hackathon - webhook calendly',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('calendlyWebhook')
  calendlyWebhook(@Body() data: any, @Req() req: Request) {
    // const apiToken = String(req.headers['x-parse-application-id']);
    // if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    console.log('os headers');
    console.log(req.headers);
    return this.usersService.calendlyWebhook(data);
  }
}
