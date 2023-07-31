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

import { UsersService } from './users.service';
import { EditUserDTO, GetUserDTO } from './dto/users.dto';

@ApiTags('Users')
@Controller('functions')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  apiTokenKey = process.env.API_TOKEN_KEY;
  deeplinkSignature = process.env.DEEPLINK_TEAM_SIGNATURE;

  // Returns a specific user:
  @ApiOperation({
    summary:
      'Returns an user from the plataform - if the user does not exist, returns null',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: GetUserDTO })
  @Post('getUser')
  getUser(@Body() data: GetUserDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.usersService.getUser(data);
  }

  // Returns a specific task:
  @ApiOperation({
    summary: 'Edits an user profile',
    description:
      'To edit a user profile, its mandatory to check if the data to change the profile was signed by the user (message signing) to assure that its the user who wants to change its profile.We create a hash with the data the user sent, the updatesNonce from the user and verifies if the signed messages matches the hash (with the address of the signer)',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token mandatory to connect with the app',
  })
  @ApiResponse({ status: 200, type: EditUserDTO })
  @Post('editUser')
  editUser(@Body() data: EditUserDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.usersService.editUser(data);
  }
}
