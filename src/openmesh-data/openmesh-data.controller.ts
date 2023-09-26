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
import { GetDatasetDTO, UploadDatasetsDTO } from './dto/openmesh-data.dto';

@ApiTags('Data products')
@Controller('openmesh-data/functions')
export class OpenmeshDataController {
  constructor(private readonly openmeshDataService: OpenmeshDataService) {}

  apiTokenKey = process.env.API_TOKEN_KEY;
  deeplinkSignature = process.env.DEEPLINK_TEAM_SIGNATURE;

  @ApiOperation({
    summary: 'Return the datasets',
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

  @ApiOperation({
    summary: 'Return the datasets',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('getDataset')
  getDataset(@Body() data: GetDatasetDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.openmeshDataService.getDataset(data);
  }

  @ApiOperation({
    summary: 'Upload the datasets',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @Post('uploadDatasets')
  uploadDatasets(@Body() data: UploadDatasetsDTO[], @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (
      String(req.headers['x-deeeplink-team-signature']) !==
      this.deeplinkSignature
    )
      throw new UnauthorizedException();
    return this.openmeshDataService.uploadDatasets(data);
  }
}
