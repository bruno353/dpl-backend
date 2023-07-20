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
import { GetTasksDto, TaskDto, TasksResponseDto } from './dto/tasks.dto';

@ApiTags('Tasks - Getting tasks on-chain; metadata and events')
@Controller('functions')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  apiTokenKey = process.env.API_TOKEN_KEY;
  deeplinkSignature = process.env.DEEPLINK_TEAM_SIGNATURE;

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
  updateTasksData(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (
      String(req.headers['x-deeeplink-team-signature']) !==
      this.deeplinkSignature
    )
      throw new UnauthorizedException();
    return this.tasksService.updateTasksData();
  }

  // Returns all the tasks with its metadata:
  @ApiOperation({
    summary: 'Returns all the tasks with its metadata',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: TasksResponseDto })
  @Post('getTasks')
  getTasks(@Body() data: GetTasksDto, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.getTasks(data);
  }
}
