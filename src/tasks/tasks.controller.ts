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
import {
  GetTaskDto,
  GetTasksDto,
  TaskDto,
  TasksResponseDto,
} from './dto/tasks.dto';
import {
  IPFSUploadTaskCreationResponseDTO,
  UploadIPFSMetadataTaskApplicationDTO,
  UploadIPFSMetadataTaskCreationDTO,
  UploadIPFSMetadataTaskSubmissionDTO,
} from './dto/metadata.dto';
import { GetTaskEventsResponseDto } from './dto/event.dto';

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

  @ApiOperation({
    summary: 'Check-update through the on-chain and off-chain task data',
  })
  @ApiHeader({
    name: 'x-deeeplink-team-signature',
    description: 'Endpoint only available for deeplink team',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('updateSingleTaskData')
  updateSingleTaskData(@Body() data: any, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (
      String(req.headers['x-deeeplink-team-signature']) !==
      this.deeplinkSignature
    )
      throw new UnauthorizedException();
    return this.tasksService.updateSingleTaskData(data.id);
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

  // Returns a specific task:
  @ApiOperation({
    summary: 'Returns a specific task with its metadata',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: TaskDto })
  @Post('getTask')
  getTask(@Body() data: GetTaskDto, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.getTask(data);
  }

  // Returns a specific task events - updates:
  @ApiOperation({
    summary: "Returns a specific task's events - updates",
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: GetTaskEventsResponseDto, isArray: true })
  @Post('getTaskEvents')
  getTaskEvents(@Body() data: GetTaskDto, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.getTaskEvents(data);
  }

  // Uploads the task's ipfs metadata for task create:
  @ApiOperation({
    summary: "Uploads the task's ipfs metadata for task creation",
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: IPFSUploadTaskCreationResponseDTO })
  @Post('uploadIPFSMetadataTaskCreation')
  uploadIPFSMetadataTaskCreation(
    @Body() data: UploadIPFSMetadataTaskCreationDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.uploadIPFSMetadataTaskCreation(data);
  }

  // Uploads the task's ipfs metadata for task application:
  @ApiOperation({
    summary: "Uploads the task's ipfs metadata for task application",
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: IPFSUploadTaskCreationResponseDTO })
  @Post('uploadIPFSMetadataTaskApplication')
  uploadIPFSMetadataTaskApplication(
    @Body() data: UploadIPFSMetadataTaskApplicationDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.uploadIPFSMetadataTaskApplication(data);
  }

  // Uploads the task's ipfs metadata for task application:
  @ApiOperation({
    summary: "Uploads the task's ipfs metadata for task submission",
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: IPFSUploadTaskCreationResponseDTO })
  @Post('uploadIPFSMetadataTaskSubmission')
  uploadIPFSMetadataTaskSubmission(
    @Body() data: UploadIPFSMetadataTaskSubmissionDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.uploadIPFSMetadataTaskSubmission(data);
  }

  //Query to get all the applications from a task and store it on database
  @ApiOperation({
    summary:
      'Query to get all the applications from a task and store it on database',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  // @ApiResponse({ status: 200, type: IPFSUploadTaskCreationResponseDTO })
  @Post('applicationsFromTask')
  applicationsFromTask(@Body() data: any, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.applicationsFromTask(data.id);
  }
}
