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

import { extname } from 'path';

import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiTags,
  ApiHeader,
  ApiBody,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';

import { Request } from 'express';

import { AuthService } from './auth.service';

import { FinanceService } from '../internalFunctions/finance.service';

import { validate } from 'class-validator';
import { GoogleSheetsService } from '../internalFunctions/googleSheets.service';
import { KYBComplyCubeDTO } from './dto/kyb-comply-cube.dto';
import { CriarUserEmpresaDTO } from './dto/criar-user-empresa.dto';
import { ConfirmarEmailDTO } from './dto/confirmar-email.dto';
import { ReenviarEmailDTO } from './dto/reenviar-email.dto';
import { EmailRecuperarSenhaDTO } from './dto/email-recuperar-senha.dto';
import {
  EmailNewsletterDTO,
  EmailSaaSMVPDTO,
} from './dto/email-newsletter.dto';
import { RecuperarSenhaDTO } from './dto/recuperar-senha.dto';
import { AlterarSenhaDTO } from './dto/alterar-senha.dto';
import { LoginDTO } from './dto/login.dto';
import { DeletarUploadedFile } from './dto/delete-uploaded-file.dto';
import { GoogleAuthGuard } from './utils/Guards';
import { UploadFinancialFilesDto } from './dto/upload-financial-files.dto';
import { DeletarFinancialUploadedFile } from './dto/delete-financial-uploaded-file.dto';
import { FinancialFileDto } from './dto/financial-file.dto';
import { UploadFinancialStringsDto } from './dto/upload-financial-strings.dto';
import { GoogleSheetsAuthGuard } from './utils/googleSheetsAuth/GoogleSheetsAuthGuard';
import {
  GetDataFromASheetsGoogle,
  getTablesNameFromASheetsGoogle,
} from './dto/get-data-from-a-sheets-google.dto';
import {
  SheetFinancialDataDto,
  SheetFinancialWithoutDataDto,
} from './dto/get-sheets-financial-data-from-user-res.dto';
import { GetDataFromACSVSheetsDTO } from './dto/get-data-from-a-csv-sheets.dto';
import { createNewDashboardFromGoogleSheetsDTO } from './dto/create-new-dashboard-from-google-sheets.dto';
import {
  DashboardDataDTO,
  GetDashboardDTO,
  GetDashboardReturnDTO,
} from './dto/get-dashboard-from-user.dto';
import {
  GetStepOnboardingDTO,
  SetStepOnboardingDTO,
} from './dto/set-step-onboarding.dto';
import {
  CreateChartForDashboardDTO,
  DeleteChartForDashboardDTO,
} from './dto/create-chart-for-dashboard.dto';

@ApiTags('Auth - Criação, login e autenticações de um usuário')
@Controller('functions')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly financeService: FinanceService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}
  apiTokenKey = process.env.API_TOKEN_KEY;
  scalableSignature = process.env.SCALABLE_SIGNATURE;

  @ApiOperation({
    summary: 'Realiza a criação do user',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('criarUserEmpresa')
  criarUserEmpresa(@Body() data: CriarUserEmpresaDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.criarUserEmpresa(data);
  }

  @ApiOperation({
    summary: 'Chamado para confirmar o email do usuário cadastrado',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('confirmarEmail')
  confirmarEmail(@Body() data: ConfirmarEmailDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.confirmarEmail(data);
  }

  @ApiOperation({
    summary:
      'Reenvia o email de confirmação para o usuário com o link de acesso',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('reenviarEmail')
  reenviarEmail(@Body() data: ReenviarEmailDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.reenviarEmail(data);
  }

  @ApiOperation({
    summary:
      'Envia um email para o usuário com instruções de recuperação de senha',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('emailRecuperarSenha')
  emailRecuperarSenha(
    @Body() data: EmailRecuperarSenhaDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.emailRecuperarSenha(data);
  }

  @ApiOperation({
    summary: 'Cadastra um email na newsletter',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('emailNewsletter')
  emailNewsletter(@Body() data: EmailNewsletterDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.emailNewsletter(data);
  }

  @ApiOperation({
    summary: 'Cadastra um email no interesse do mvp do saas',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('emailSaasMVPNewsletter')
  emailSaasMVPNewsletter(@Body() data: EmailSaaSMVPDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.emailSaasMVPNewsletter(data);
  }

  @ApiOperation({
    summary:
      'Realiza a alteração da senha do usuário pelo fluxo de /emailRecuperarSenha',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('recuperarSenha')
  recuperarSenha(@Body() data: RecuperarSenhaDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.recuperarSenha(data);
  }

  @ApiOperation({
    summary:
      'Realiza a alteração da senha do usuário - o usuário deve passar a sua senha antiga para confirmação',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('alterarSenha')
  alterarSenha(@Body() data: AlterarSenhaDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.alterarSenha(data);
  }

  @ApiOperation({
    summary: 'Realiza o login do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('login')
  login(@Body() data: LoginDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.login(data);
  }

  @ApiOperation({
    summary: 'Deprecated',
  })
  @Post('getUserBalance')
  getUserBalance(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.getUserBalance(req);
  }

  @ApiOperation({
    summary: 'Retorna informações do usuário referenciado no accessToken',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getCurrentUser')
  getCurrentUser(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.getCurrentUser(req);
  }

  @ApiOperation({
    summary: 'Deprecated',
  })
  @Post('getIsUserMultiSign')
  getIsUserMultiSign(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.getIsUserMultiSign(req);
  }

  @ApiOperation({
    summary: 'Deprecated',
  })
  @Post('getIsKYCedAnd2FA')
  getIsKYCedAnd2FA(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.getIsKYCedAnd2FA(req);
  }

  @ApiOperation({
    summary: 'Deprecated',
  })
  @Post('getIsKYCed')
  getIsKYCed(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.getIsKYCed(req);
  }

  @ApiOperation({
    summary: 'Deprecated',
  })
  @Post('criarToken2FA')
  criarToken2FA(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.criarToken2FA(req);
  }

  @ApiOperation({
    summary: 'Deprecated',
  })
  @Post('verificarToken2FA')
  verificarToken2FA(@Body() data: any, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.verificarToken2FA(data, req);
  }

  @ApiOperation({
    summary: 'Deprecated',
  })
  @Post('use2FA')
  use2FA(@Body() data: any, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.use2FA(data);
  }

  @ApiOperation({
    summary: 'Deprecated',
  })
  @Post('deactivate2FA')
  deactivate2FA(@Body() data: any, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.deactivate2FA(data, req);
  }

  @ApiOperation({
    summary: 'Deprecated',
  })
  @Post('isUserMetamaskKYCed')
  isUserMetamaskKYCed(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.isUserMetamaskKYCed();
  }

  @ApiOperation({
    summary: 'Deprecated',
  })
  @Post('allowanceFromUserMetamask')
  allowanceFromUserMetamask(@Body() data: any, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.allowanceFromUserMetamask(data);
  }

  @ApiOperation({
    summary: 'Realiza o upload de arquivos diversos que o usuário anexou',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @ApiHeader({
    name: 'Content-Type',
    description: 'application/x-www-form-urlencoded',
  })
  @Post('uploadFiles')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFiles(
    @Body()
    data: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (files.length > 15) {
      throw new BadRequestException('Upload exceeds 15 files', {
        cause: new Error(),
        description: 'Upload exceeds 15 files',
      });
    }
    const maxFileSize = 10 * 1024 * 1024; // 10 MB
    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'pdf',
      'xlsx',
      'csv',
      'txt',
      'docx',
      'json',
    ];
    const promises = files.map(async (file) => {
      const validationErrors = await validate(file, {
        validationError: { target: false },
      });
      if (validationErrors.length > 0) {
        throw new BadRequestException(validationErrors);
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} is too large, maximum allowed size is ${
            maxFileSize / 1024 / 1024
          } MB`,
        );
      }
      const fileExtension = extname(file.originalname).substring(1);
      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        throw new BadRequestException(
          'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf, xlsx, csv, txt, docx, json',
        );
      }
    });

    await Promise.all(promises);
    return this.authService.uploadFiles(data, files, req);
  }

  @ApiOperation({
    summary: 'Deleta um arquivo do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('deleteUploadedFile')
  deleteUploadedFile(@Body() data: DeletarUploadedFile, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.deleteUploadedFile(data, req);
  }

  @ApiOperation({
    summary: 'Deleta um arquivo financeiro do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('deleteFinancialUploadedFile')
  deleteFinancialUploadedFile(
    @Body() data: DeletarFinancialUploadedFile,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.deleteFinancialUploadedFile(data, req);
  }

  @ApiOperation({
    summary: 'Realiza o upload de arquivos financeiros que o usuário anexa',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @ApiConsumes('multipart/form-data')
  @Post('uploadFinancialFiles')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFinancialFiles(
    @Body() data: UploadFinancialFilesDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    console.log('o arquivo');
    console.log(files);
    if (!files) {
      throw new BadRequestException('1 file per time', {
        cause: new Error(),
        description: '1 file per time',
      });
    }
    if (files.length === 0) {
      throw new BadRequestException('1 file per time', {
        cause: new Error(),
        description: '1 file per time',
      });
    }
    const maxFileSize = 20 * 1024 * 1024; // 20 MB
    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'pdf',
      'xlsx',
      'csv',
      'txt',
      'docx',
      'json',
      'zip',
    ];
    const promises = files.map(async (file) => {
      const validationErrors = await validate(file, {
        validationError: { target: false },
      });
      if (validationErrors.length > 0) {
        throw new BadRequestException(validationErrors);
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} is too large, maximum allowed size is ${
            maxFileSize / 1024 / 1024
          } MB`,
        );
      }
      const fileExtension = extname(file.originalname).substring(1);
      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        throw new BadRequestException(
          'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf, xlsx, csv, txt, docx, json, zip',
        );
      }
    });

    await Promise.all(promises);
    //pegando so o primeiro arquivo que for enviado
    return this.authService.uploadFinancialFiles(data, [files[0]], req);
  }

  //fazer o upload de alguma string no bucket aws do usuário:
  @ApiOperation({
    summary:
      'Realiza o upload de strings/urls financeiras que o usuário inputa',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('uploadFinancialStrings')
  uploadFinancialStrings(
    @Body() data: UploadFinancialStringsDto,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.authService.uploadFinancialStrings(data, req);
  }

  //retorna o buffer de um file armazenado na aws
  @ApiOperation({
    summary: 'Retorna o buffer de um file armazenado na aws',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getFileBuffer')
  getFileBuffer(@Body() data: any, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.authService.getFileBuffer(data, req);
  }

  @ApiOperation({
    summary: 'Retorna todos os arquivos do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getFiles')
  getFiles(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.getFiles(req);
  }

  @ApiOperation({
    summary: 'Retorna todos os arquivos financeiros do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @ApiResponse({
    status: 200,
    description: 'A lista de arquivos financeiros do usuário.',
    type: FinancialFileDto,
    isArray: true,
  })
  @Post('getFinancialFiles')
  getFinancialFiles(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.getFinancialFiles(req);
  }

  @ApiOperation({
    summary: 'Atualiza sobre o step que o usuário está no onboarding',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('setStepOnboarding')
  setStepOnboarding(@Body() data: SetStepOnboardingDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.setStepOnboarding(data, req);
  }

  @ApiOperation({
    summary:
      'Retorna em qual step o user está no onboarding > onboarding tem 7 steps; se esse valor estiver com "8" significa que completou todos os steps ou escolheu pular o onboarding',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @ApiResponse({
    status: 200,
    description: 'The data has been successfully returned.',
    type: GetStepOnboardingDTO,
  })
  @Post('getStepOnboarding')
  getStepOnboarding(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();

    return this.authService.getStepOnboarding(req);
  }

  //fazer KYB - big data:
  @ApiOperation({
    summary: 'Admin - realiza o kyb do usuário - Big Data Corp',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('kyb')
  KYBBigData(@Body() data: any, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (String(req.headers['x-scalable-signature']) !== this.scalableSignature)
      throw new UnauthorizedException();
    return this.financeService.KYBBigData(data);
  }

  //fazer KYB - Comply cube:
  @ApiOperation({
    summary: 'Admin - realiza o kyb do usuário - ComplyCube + Big Data Corp',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('kybComplyCube')
  kybComplyCube(@Body() data: KYBComplyCubeDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (String(req.headers['x-scalable-signature']) !== this.scalableSignature)
      throw new UnauthorizedException();
    return this.financeService.kybComplyCube(data);
  }

  //webhook KYB - Comply cube:
  @Post('webhookKYBComplyCube')
  webhookKYBComplyCube(@Body() data: any, @Req() req: Request) {
    return this.financeService.webhookKYBComplyCube(data, req);
  }

  @ApiOperation({
    summary: 'Login Google',
  })
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  handleLogin() {
    return;
  }

  @ApiOperation({
    summary: 'Redirect Google',
  })
  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  handleRedirect(@Req() request: Request) {
    return request.user;
  }

  @ApiOperation({
    summary: 'Autorização Google Sheets',
  })
  @Get('google/sheets/authorize')
  @UseGuards(GoogleSheetsAuthGuard)
  handleSheetsAuthorize() {
    return;
  }

  @ApiOperation({
    summary: 'Redirect Google Sheets',
  })
  @Get('google/sheets/redirect')
  @UseGuards(GoogleSheetsAuthGuard)
  handleSheetsRedirect(@Req() request: Request) {
    // Chamar função para listar os arquivos do Google Sheets após a autenticação bem-sucedida
    // await this.yourService.listFiles(request.user.token);
    return request.user;
  }

  @ApiOperation({
    summary:
      'Cria um novo dashboard financeiro, já armazenando dados de planilha(s) do google sheets.',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('createNewDashboardFromGoogleSheets')
  createNewDashboardFromGoogleSheets(
    @Body() data: createNewDashboardFromGoogleSheetsDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.authService.createNewDashboardFromGoogleSheets(data, req);
  }

  @ApiOperation({
    summary: 'Retorna todos os dashboards criados pelo usuário.',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @ApiResponse({
    status: 200,
    description: 'The data has been successfully returned.',
    type: [DashboardDataDTO],
  })
  @Post('getDashboardsFromUser')
  getDashboardsFromUser(@Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.authService.getDashboardsFromUser(req);
  }

  @ApiOperation({
    summary: 'Retorna informações e métricas de um dashboard em específico.',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @ApiResponse({
    status: 200,
    description: 'The data has been successfully returned.',
    type: [GetDashboardReturnDTO],
  })
  @Post('getDashboard')
  getDashboard(@Body() data: GetDashboardDTO, @Req() req: Request) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.authService.getDashboard(data, req);
  }

  @ApiOperation({
    summary: 'Cria um novo gráfico de métricas para um dashboard.',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('createNewChartForDashboard')
  createNewChartForDashboard(
    @Body() data: CreateChartForDashboardDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.authService.createNewChartForDashboard(data, req);
  }

  @ApiOperation({
    summary: 'Deleta um gráfico de um dashboard.',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('deleteChartForDashboard')
  deleteChartForDashboard(
    @Body() data: DeleteChartForDashboardDTO,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.authService.deleteChartForDashboard(data, req);
  }

  @ApiOperation({
    summary:
      'Endpoint auxiliar para retornar todos os nomes das tabelas de uma sheet do google',
  })
  @ApiHeader({
    name: 'x-scalable-signature',
    description: 'Signature Scalable',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getSheetTabNames')
  getSheetTabNames(
    @Body() data: getTablesNameFromASheetsGoogle,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    return this.authService.getSheetTabNames(data, req);
  }

  @ApiOperation({
    summary:
      'Admin - Faz o upload do ccb da operação - se existe algum arquivo antigo ele será apagado',
  })
  @ApiHeader({
    name: 'X-Parse-Session-Token',
    description: 'Token necessário para autenticar a sessão do usuário',
  })
  @ApiHeader({
    name: 'X-Parse-Application-Id',
    description: 'Token necessário para se autenticar à api',
  })
  @Post('getDataFromACSVSheets')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  async getDataFromACSVSheets(
    @Body()
    data: GetDataFromACSVSheetsDTO,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (files.length != 1) {
      throw new BadRequestException('1 file per time', {
        cause: new Error(),
        description: '1 file per time',
      });
    }
    const maxFileSize = 20 * 1024 * 1024; // 20 MB
    const allowedExtensions = ['csv'];
    const promises = files.map(async (file) => {
      const validationErrors = await validate(file, {
        validationError: { target: false },
      });
      if (validationErrors.length > 0) {
        throw new BadRequestException(validationErrors);
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} is too large, maximum allowed size is ${
            maxFileSize / 1024 / 1024
          } MB`,
        );
      }
      const fileExtension = extname(file.originalname).substring(1);
      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        throw new BadRequestException(
          'File type not allowed. Allowed extensions: csv',
        );
      }
    });

    await Promise.all(promises);
    return this.authService.getDataFromACSVSheets(data, files, req);
  }
}
