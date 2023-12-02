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
  GetSubmissionDto,
  GetSubmissionResponseDto,
  GetTaskDto,
  GetTasksDto,
  GetTokensNecessaryToFillRequestDTO,
  GetUserToDraftTaskDto,
  TaskDto,
  TasksResponseDto,
} from './dto/tasks.dto';
import {
  IPFSUploadTaskCreationResponseDTO,
  UploadIPFSMetadataTaskApplicationDTO,
  UploadIPFSMetadataTaskCreationDTO,
  UploadIPFSMetadataTaskDraftCreationDTO,
  UploadIPFSMetadataTaskSubmissionDTO,
  UploadIPFSMetadataTaskSubmissionRevisionDTO,
  UploadMetadataTaskApplicationOffchainDTO,
} from './dto/metadata.dto';
import { GetTaskEventsResponseDto } from './dto/event.dto';
import { UpdatesService } from './updates.service';
import { UpdatesGovernanceService } from './updates-governance.service';

@ApiTags('Tasks - Getting tasks on-chain; metadata and events')
@Controller('functions')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly updatesService: UpdatesService,
    private readonly updatesGovernanceService: UpdatesGovernanceService,
  ) {}

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
    return this.updatesService.updateSingleTaskData(data.id);
  }

  @ApiOperation({
    summary:
      'initiate the workflow to update all the governance workflow - drafted tasks, votings, verifiedc contributors nfts... etc',
  })
  @ApiHeader({
    name: 'x-deeeplink-team-signature',
    description: 'Endpoint only available for deeplink team',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('updateGovernanceData')
  updateGovernanceData(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (
      String(req.headers['x-deeeplink-team-signature']) !==
      this.deeplinkSignature
    )
      throw new UnauthorizedException();
    return this.updatesGovernanceService.updateGovernanceData();
  }

  @ApiOperation({
    summary:
      'Runs a check to update the estiamted budget of a task and its applications',
  })
  @ApiHeader({
    name: 'x-deeeplink-team-signature',
    description: 'Endpoint only available for deeplink team',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('updateEstimationBudgetTaskAndApplications')
  updateEstimationBudgetTaskAndApplications(
    @Body() data: any,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (
      String(req.headers['x-deeeplink-team-signature']) !==
      this.deeplinkSignature
    )
      throw new UnauthorizedException();
    return this.updatesService.updateEstimationBudgetTaskAndApplications(
      data.id,
    );
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

  // Returns all the tasks updates and activities:
  @ApiOperation({
    summary: 'Returns all the tasks updates and activities',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('getTasksEvents')
  getTasksEvents(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.getTasksEvents();
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

  // Returns a specific task:
  @ApiOperation({
    summary: 'Returns a specific drafted task with its metadata',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: TaskDto })
  @Post('getDraftTask')
  getDraftTask(@Body() data: GetTaskDto, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.getDraftTask(data);
  }

  // Returns a specific task:
  @ApiOperation({
    summary:
      'returns if the user is allowed to vote and if its already voted for the task etc.',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  // @ApiResponse({ status: 200, exa: TaskDto })
  @Post('getUserToDraftTask')
  getUserToDraftTask(@Body() data: GetUserToDraftTaskDto, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.getUserToDraftTask(data);
  }

  // Returns a specific task:
  @ApiOperation({
    summary:
      'Everytime an user submit an application, its necessary to calculate, based on the percentage of the estimated budget he is asking for, how many tokens this application will request.',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: TaskDto })
  @Post('getTokensNecessaryToFillRequest')
  getTokensNecessaryToFillRequest(
    @Body() data: GetTokensNecessaryToFillRequestDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.getTokensNecessaryToFillRequest(data);
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

  @ApiOperation({
    summary: "Uploads the task's ipfs metadata for task draft creation",
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: IPFSUploadTaskCreationResponseDTO })
  @Post('uploadIPFSMetadataTaskDraftCreation')
  uploadIPFSMetadataTaskDraftCreation(@Body() data: any, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.uploadIPFSMetadataTaskDraftCreation(data);
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

  // Uploads the task's ipfs metadata for task application:
  @ApiOperation({
    summary: "Uploads the task's ipfs metadata for task submission",
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: IPFSUploadTaskCreationResponseDTO })
  @Post('uploadIPFSMetadataTaskSubmissionRevision')
  uploadIPFSMetadataTaskSubmissionRevision(
    @Body() data: UploadIPFSMetadataTaskSubmissionRevisionDTO,
    @Req() req: Request,
  ): any {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.uploadIPFSMetadataTaskSubmissionRevision(data);
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

  // Returns a specific task's submission:
  @ApiOperation({
    summary: "Returns a specific task's submission",
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: GetSubmissionResponseDto, isArray: true })
  @Post('getSubmission')
  getSubmission(@Body() data: GetSubmissionDto, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.getSubmission(data);
  }

  // Returns a specific task's submission:
  // @ApiOperation({
  //   summary: "Returns a specific task's submission",
  // })
  // @ApiHeader({
  //   name: 'X-Parse-Application-Id',
  //   description: 'Token mandatory to connect with the app',
  // })
  // @ApiResponse({ status: 200, type: GetSubmissionResponseDto, isArray: true })
  // @Post('testSpam')
  // testSpam(@Req() req: Request) {
  //   const apiToken = String(req.headers['x-parse-application-id']);
  //   if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
  //   return this.tasksService.testSpam();
  // }
  @ApiOperation({
    summary: 'WEB2 user - Apply to a task',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: IPFSUploadTaskCreationResponseDTO })
  @Post('createTaskApplicationWeb2')
  createTaskApplicationWeb2(
    @Body() data: UploadMetadataTaskApplicationOffchainDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.createTaskApplicationWeb2(data, req);
  }

  // Returns all the tasks with its metadata:
  @ApiOperation({
    summary: 'Returns the fundraising balance',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Get('getFundraisingInfo')
  getFundraisingInfo(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.getFundraisingInfo();
  }

  // Returns all the tasks with its metadata:
  @ApiOperation({
    summary: 'Returns the fundraising balance',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Get('getFundraisingTransactions')
  getFundraisingTransactions(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.tasksService.getFundraisingTransactions();
  }
}
