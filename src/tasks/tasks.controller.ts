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

import { TasksService } from './tasks.service';

@ApiTags('Tasks - Getting tasks on-chain; metadata and events')
@Controller('functions')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  apiTokenKey = process.env.API_TOKEN_KEY;
  scalableSignature = process.env.DEEPLINK_TEAM_SIGNATURE;

  //Runs a check-update through the on-chain and off-chain tasks data and store it in the database - its used to always be updated with the tasks data:
  @ApiOperation({
    summary: 'Check-update through the on-chain and off-chain tasks data',
  })
  @ApiHeader({
    name: 'x-deeeplink-team-signature',
    description: 'Endpoint only available for deeplink team',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('updateTasksData')
  KYBBigData(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (String(req.headers['x-scalable-signature']) !== this.scalableSignature)
      throw new UnauthorizedException();
    return this.tasksService.updateTasksData();
  }
}
