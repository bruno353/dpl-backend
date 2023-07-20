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

import { EventsHandlerService } from './events-handler.service';

@ApiTags('Events - Flow to handle events emitted by the smart-contracts')
@Controller('functions')
export class EventsHandlerController {
  constructor(private readonly eventsHandlerService: EventsHandlerService) {}
}
