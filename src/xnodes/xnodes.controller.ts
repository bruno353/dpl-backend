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
  Put,
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

import { XnodesService } from './xnodes.service';
import { CreateXnodeDto, GetXnodeDto, UpdateXnodeDto } from './dto/xnodes.dto';

@ApiTags('Xnodes - Managing xnodes')
@Controller('xnodes/functions')
export class XnodesController {
  constructor(private readonly xnodesService: XnodesService) {}

  apiTokenKey = process.env.API_TOKEN_KEY;
  deeplinkSignature = process.env.DEEPLINK_TEAM_SIGNATURE;

  @ApiOperation({
    summary: 'Create a xnode',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('createXnode')
  createXnode(@Body() data: CreateXnodeDto, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.xnodesService.createXnode(data, req);
  }

  @ApiOperation({
    summary: 'Update a xnode',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Put('updateXnode')
  updateXnode(@Body() data: UpdateXnodeDto, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.xnodesService.updateXnode(data, req);
  }

  @ApiOperation({
    summary: 'Returns a xnode',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Get('getXnode')
  getXnode(@Body() data: GetXnodeDto, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.xnodesService.getXnode(data, req);
  }

  @ApiOperation({
    summary: 'Returns general stats and a listing of all nodes validators',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Get('getNodesValidatorsStats')
  getNodesValidatorsStats(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.xnodesService.getNodesValidatorsStats();
  }

  @ApiOperation({
    summary:
      'Returns general stats and a listing of all nodes validators, and also returns the data about a specific xnode',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('getXnodeWithNodesValidatorsStats')
  getXnodeWithNodesValidatorsStats(
    @Body() data: GetXnodeDto,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.xnodesService.getXnodeWithNodesValidatorsStats(data);
  }

  @ApiOperation({
    summary: 'Returns all user xnodes',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Get('getXnodes')
  getXnodes(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.xnodesService.getXnodes(req);
  }
}
