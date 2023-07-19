import {
  ConflictException,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import { join, extname } from 'path';
// import { import_ } from '@brillout/import';
import { ethers } from 'ethers';
import * as Papa from 'papaparse';
import { google, Auth } from 'googleapis';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { SimpleCrypto } from 'simple-crypto-js';

import { PrismaService } from '../database/prisma.service';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

import erc20ABI from './contract/erc20.json';

// import { PineconeClient } from '@pinecone-database/pinecone';

import { DidDTO } from './dto/did.dto';
import { Request, response } from 'express';
import axios from 'axios';

import { FinanceService } from '../internalFunctions/finance.service';
import { GoogleSheetsService } from '../internalFunctions/googleSheets.service';
import { GoogleBucketService } from '../internalFunctions/googleBucket.service';
import { EmailSenderService } from '../internalFunctions/emailSender.service';
import { LogService } from '../internalFunctions/log.service';
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
import { DeletarFinancialUploadedFile } from './dto/delete-financial-uploaded-file.dto';
import { UploadFinancialFilesDto } from './dto/upload-financial-files.dto';
import { AWSBucketService } from 'src/internalFunctions/awsBucket.service';
import { UploadFinancialStringsDto } from './dto/upload-financial-strings.dto';
import {
  GetDataFromASheetsGoogle,
  getTablesNameFromASheetsGoogle,
} from './dto/get-data-from-a-sheets-google.dto';
import { GetDataFromACSVSheetsDTO } from './dto/get-data-from-a-csv-sheets.dto';
import { createNewDashboardFromGoogleSheetsDTO } from './dto/create-new-dashboard-from-google-sheets.dto';
import { GetDashboardDTO } from './dto/get-dashboard-from-user.dto';
import { SetStepOnboardingDTO } from './dto/set-step-onboarding.dto';
import {
  CreateChartForDashboardDTO,
  DeleteChartForDashboardDTO,
} from './dto/create-chart-for-dashboard.dto';

interface FetchDataGoogleSheetsOptions {
  spreadsheetId: string;
  sheetName: string;
  dateRowStart: string;
  dataColumnStart: string;
}
interface FetchDataCSVOptions {
  data: any;
  sheetName: string;
  dateRowStart: string;
  dataColumnStart: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly googleBucketService: GoogleBucketService,
    private readonly emailSenderService: EmailSenderService,
    private readonly awsBucketService: AWSBucketService,
    private readonly logService: LogService,
  ) {}
  simpleCryptoJs = new SimpleCrypto(process.env.CIPHER);

  usdcAddress = process.env.USDC_ADDRESS;

  web3UrlProvider = process.env.WEB3_URL_PROVIDER;
  web3Provider = new ethers.providers.JsonRpcProvider(this.web3UrlProvider);

  viewPrivateKey =
    'a7ec59c41ec3608dece33851a7d805bf22cd33da3e22e438bfe033349eb04011';

  contaAzulClientId = process.env.CONTA_AZUL_CLIENT_ID;
  contaAzulClientSecret = process.env.CONTA_AZUL_CLIENT_SECRET;
  contaAzulRedirectURI = process.env.CONTA_AZUL_REDIRECT;

  //chaves da pluggy
  clientId = process.env.CLIENT_ID;
  clientSecret = process.env.CLIENT_SECRET;

  async criarUserEmpresa(data: CriarUserEmpresaDTO) {
    const results = await this.prisma.usuario.findFirst({
      where: {
        email: data.email,
      },
    });
    if (results) {
      //se uma conta já foi criada com esse email e o email não foi confirmado,  deletamos essa conta antiga e criamos a nova.
      if (
        results.emailConfirmado === false &&
        Number(results.timestampContaCriada) + 86400 <
          Math.round(Date.now() / 1000)
      ) {
        await this.prisma.usuario.delete({
          where: {
            email: data.email,
          },
        });
      }
      //se uma conta com esse email já foi criada em menos de 24 horas, não deixamos ele criar outra.
      else if (
        results.emailConfirmado === false &&
        Number(results.timestampContaCriada) + 86400 >=
          Math.round(Date.now() / 1000)
      ) {
        throw new BadRequestException(
          'Email already registered but not confirmed yet (wait 24 hours to try to register another account within this mail)',
          {
            cause: new Error(),
            description:
              'Email already registered but not confirmed yet (wait 24 hours to try to register another account within this mail)',
          },
        );
      }
      //se o email já está em uso:
      else if (results.emailConfirmado === true) {
        throw new BadRequestException('Email already in use', {
          cause: new Error(),
          description: 'Email already in use',
        });
      }
    }
    const cnpjExiste = await this.prisma.usuario.findFirst({
      where: {
        cnpj: data.cnpj,
      },
    });
    if (cnpjExiste) {
      throw new BadRequestException('CNPJ already in use', {
        cause: new Error(),
        description: 'CNPJ already in use',
      });
    }
    const cnpjValido = await this.validarCNPJ(data.cnpj);
    if (!cnpjValido) {
      throw new BadRequestException('Invalid CNPJ', {
        cause: new Error(),
        description: 'Invalid CNPJ',
      });
    }

    const tantumResponse = await this.criarWalletTatum();
    const cipherEth = this.simpleCryptoJs.encrypt(tantumResponse.walletId);

    //gerando password:
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const id = crypto.randomBytes(16);
    const id2 = id.toString('hex');

    const response = await this.prisma.usuario.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nome: data.nome,
        timestampContaCriada: String(Math.round(Date.now() / 1000)),
        hashConfirmarEmail: id2,
        address: tantumResponse.address,
        tantumId: cipherEth,
        isBorrower: true,
        arr: data.arr,
        runway: data.runway,
        sobre: data.sobre,
        tipoNegocio: data.tipoNegocio,
        cnpj: data.cnpj,
        nomeEmpresa: data.nomeEmpresa,
      },
    });

    const jwt = await this.jwtService.signAsync({ id: response.id });

    await this.emailSenderService.emailConfirmacaoConta(id2, data.email);

    const userFinalReturn = {
      email: response.email,
      nome: response.nome,
      sobrenome: response.sobrenome,
      timestampContaCriada: response.timestampContaCriada,
      address: response.address,
      usdcAmount: response.usdcAmount,
      emailConfirmado: response.emailConfirmado,
      accountVerified: response.accountVerified,
      verified2FA: response.verified2FA,
      use2FA: response.use2FA,
      sessionToken: jwt,
      createdAt: response.criadoEm,
      nomeEmpresa: response.nomeEmpresa,
      arr: response.arr,
      runway: response.runway,
      CNPJ: response.cnpj,
      isBorrower: true,
      tipoNegocio: response.tipoNegocio,
      sobre: response.sobre,
    };

    await this.emailSenderService.emailNovoUser(response);

    //enviando email de lead:

    setTimeout(() => {
      this.emailSenderService.emailNovoUserLead(response);
    }, 300000);

    await this.prisma.kYBUsuario.create({
      data: {
        usuarioId: response.id,
      },
    });

    //criando sheets para o usuário no drive:
    this.googleSheetsService.checkGoogleDriveStartupSheet(response.id);

    //atualizando sheet de usuários no drive:
    this.googleSheetsService.writeSheetUsuariosStartups();

    //this.financeService.KYBBigData(response.id);
    return userFinalReturn;
  }

  async confirmarEmail(data: ConfirmarEmailDTO) {
    return await this.prisma.usuario.updateMany({
      data: {
        emailConfirmado: true,
      },
      where: {
        hashConfirmarEmail: data.objectId,
      },
    });
  }

  async login(data: LoginDTO) {
    const user = await this.prisma.usuario.findFirst({
      where: {
        email: data.email,
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid username/password.', {
        cause: new Error(),
        description: 'Invalid username/password.',
      });
    }
    const passwordCompare = await bcrypt.compare(data.password, user.password);
    let sessionToken: string;

    if (user && passwordCompare) {
      sessionToken = await this.jwtService.signAsync({
        id: user.id,
      });
    } else {
      throw new BadRequestException('Invalid username/password.', {
        cause: new Error(),
        description: 'Invalid username/password.',
      });
    }

    if (!user.emailConfirmado)
      throw new BadRequestException('Unconfirmed Email', {
        cause: new Error(),
        description: 'Unconfirmed Email',
      });
    if (!user.userEnabled)
      throw new BadRequestException('User disabled', {
        cause: new Error(),
        description: 'User disabled',
      });

    if (user.use2FA) {
      await this.verify2FAAuth(user.secret2FA, data.token2FA);
    }
    if (user.isBorrower) {
      try {
        await this.checkBankingAPIsUpdate(user.id);
      } catch (err) {
        console.log('erro no checkBalance');
      }
    }

    const operacoesFound = await this.prisma.operacoesCredito.findMany({
      where: {
        usuarioId: user.id,
        aberto: true,
      },
    });

    const jwt = await this.jwtService.signAsync({ id: user.id });

    const userFinalReturn = {
      email: user.email,
      nome: user.nome,
      sobrenome: user.sobrenome,
      timestampContaCriada: user.timestampContaCriada,
      address: user.address,
      usdcAmount: user.usdcAmount,
      emailConfirmado: user.emailConfirmado,
      accountVerified: user.accountVerified,
      verified2FA: user.verified2FA,
      use2FA: user.use2FA,
      sessionToken: jwt,
      balance: 0,
      createdAt: user.criadoEm,
      nomeEmpresa: user.nomeEmpresa,
      CNPJ: user.cnpj,
      isBorrower: user.isBorrower,
      tipoNegocio: user.tipoNegocio,
      possuiOperacoesCreditoOn: operacoesFound ? true : false,
      onBoardingSteps: user.onBoardingSteps,
      isAdmin: user.isAdmin,
      sobre: user.sobre,
    };

    return userFinalReturn;
  }

  //função interna que realiza o login pelo google auth 2.0; Este service é chamado pelas dependencias que realizam a verificação do auth2.0; Se um user com email
  //existir, retorna todas infos do user (e o access token) o parametro userExists: true, se não, retorna o email do user e o parametro userExists: false;
  async loginGoogle(email: string) {
    console.log('login google chamado');
    const user = await this.prisma.usuario.findFirst({
      where: {
        email,
      },
    });
    if (!user) {
      const userReturn = {
        userExists: false,
        email,
      };
      console.log('login google - user não existe');
      return userReturn;
    }

    if (!user.userEnabled)
      throw new BadRequestException('User disabled', {
        cause: new Error(),
        description: 'User disabled',
      });

    if (!user.emailConfirmado) {
      //como o user está logando pelo oauth 2.0, sabemos que seu email é confirmado.
      await this.prisma.usuario.update({
        where: {
          id: user.id,
        },
        data: {
          emailConfirmado: true,
        },
      });
    }

    if (user.isBorrower) {
      try {
        await this.checkBankingAPIsUpdate(user.id);
      } catch (err) {
        console.log('erro no checkBalance');
      }
    }

    const jwt = await this.jwtService.signAsync({ id: user.id });

    const userFinalReturn = {
      userExists: true,
      email: user.email,
      nome: user.nome,
      sobrenome: user.sobrenome,
      timestampContaCriada: user.timestampContaCriada,
      address: user.address,
      usdcAmount: user.usdcAmount,
      emailConfirmado: user.emailConfirmado,
      accountVerified: user.accountVerified,
      verified2FA: user.verified2FA,
      use2FA: user.use2FA,
      sessionToken: jwt,
      balance: 0,
      createdAt: user.criadoEm,
      nomeEmpresa: user.nomeEmpresa,
      CNPJ: user.cnpj,
      isBorrower: user.isBorrower,
      tipoNegocio: user.tipoNegocio,
      onBoardingSteps: user.onBoardingSteps,
      isAdmin: user.isAdmin,
      sobre: user.sobre,
    };

    return userFinalReturn;
  }

  async reenviarEmail(data: ReenviarEmailDTO) {
    const user = await this.prisma.usuario.findFirst({
      where: {
        email: data.email,
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid user', {
        cause: new Error(),
        description: 'Invalid user',
      });
    }
    if (!user.userEnabled || user.emailConfirmado) {
      throw new BadRequestException('Email already confirmed', {
        cause: new Error(),
        description: 'Email already confirmed',
      });
    }
    await this.emailSenderService.emailConfirmacaoConta(
      user.hashConfirmarEmail,
      user.email,
    );
  }

  //Endpoint para recuperar senha do usuário (usado após chamar o endpoint "emailRecuperarSenha").
  async recuperarSenha(data: RecuperarSenhaDTO) {
    const recuperarSenha = await this.prisma.recuperarSenha.findFirst({
      where: {
        txid: data.objectId,
      },
    });
    if (!recuperarSenha) {
      throw new BadRequestException('Couldnt find txid', {
        cause: new Error(),
        description: 'Couldnt find txid',
      });
    }
    if (!recuperarSenha.isValid) {
      throw new BadRequestException('Invalid recuperarSenha', {
        cause: new Error(),
        description: 'Invalid recuperarSenha',
      });
    }
    if (
      Number(recuperarSenha.timeStamp) + 86400 <
      Math.round(Date.now() / 1000)
    ) {
      throw new BadRequestException('recuperarSenha timeout 86400 sec', {
        cause: new Error(),
        description: 'recuperarSenha timeout 86400 sec',
      });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.newPassword, salt);

    await this.prisma.usuario.updateMany({
      where: {
        id: recuperarSenha.usuarioId,
      },
      data: {
        password: hashedPassword,
      },
    });

    const jwt = await this.jwtService.signAsync({
      id: recuperarSenha.usuarioId,
    });

    const user = await this.prisma.usuario.findFirst({
      where: {
        id: recuperarSenha.usuarioId,
      },
    });

    await this.prisma.recuperarSenha.delete({
      where: {
        txid: data.objectId,
      },
    });

    const userFinalReturn = {
      email: user.email,
      nome: user.nome,
      sobrenome: user.sobrenome,
      timestampContaCriada: user.timestampContaCriada,
      address: user.address,
      usdcAmount: user.usdcAmount,
      emailConfirmado: user.emailConfirmado,
      accountVerified: user.accountVerified,
      verified2FA: user.verified2FA,
      use2FA: user.use2FA,
      sessionToken: jwt,
      createdAt: user.criadoEm,
      nomeEmpresa: user.nomeEmpresa,
      CNPJ: user.cnpj,
      isBorrower: user.isBorrower,
      tipoNegocio: user.tipoNegocio,
      sobre: user.sobre,
    };
    return userFinalReturn;
  }

  async emailRecuperarSenha(data: EmailRecuperarSenhaDTO) {
    const usuarioExiste = await this.prisma.usuario.findFirst({
      where: {
        email: data.email,
      },
    });
    if (!usuarioExiste) {
      console.log('usuario não existe');
      return;
    }
    if (!usuarioExiste.userEnabled) {
      console.log('usuario não enabled');
      return;
    }

    const id = crypto.randomBytes(16);
    const id2 = id.toString('hex');

    await this.prisma.recuperarSenha.create({
      data: {
        usuarioId: usuarioExiste.id,
        email: usuarioExiste.email,
        txid: id2,
        timeStamp: String(Math.round(Date.now() / 1000)),
      },
    });

    await this.emailSenderService.emailRecSenha(usuarioExiste.email, id2);
  }

  //Endpoint para recuperar senha do usuário (usado após chamar o endpoint "emailRecuperarSenha").
  async alterarSenha(data: AlterarSenhaDTO) {
    const user = await this.prisma.usuario.findFirst({
      where: {
        email: data.email,
      },
    });

    const passwordCompare = await bcrypt.compare(data.password, user.password);
    let sessionToken: string;

    if (user && passwordCompare) {
      sessionToken = await this.jwtService.signAsync({
        id: user.id,
      });
    } else {
      throw new BadRequestException('Invalid username/password.', {
        cause: new Error(),
        description: 'Invalid username/password.',
      });
    }

    if (!user.emailConfirmado)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Unconfirmed Email',
      });
    if (!user.userEnabled)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'User disabled',
      });

    //setando nova senha:
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.newPassword, salt);

    await this.prisma.usuario.updateMany({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    const jwt = await this.jwtService.signAsync({
      id: user.id,
    });

    const userFinalReturn = {
      email: user.email,
      nome: user.nome,
      sobrenome: user.sobrenome,
      timestampContaCriada: user.timestampContaCriada,
      address: user.address,
      usdcAmount: user.usdcAmount,
      emailConfirmado: user.emailConfirmado,
      accountVerified: user.accountVerified,
      verified2FA: user.verified2FA,
      use2FA: user.use2FA,
      sessionToken: jwt,
      createdAt: user.criadoEm,
      nomeEmpresa: user.nomeEmpresa,
      CNPJ: user.cnpj,
      isBorrower: user.isBorrower,
      tipoNegocio: user.tipoNegocio,
      sobre: user.sobre,
    };

    return userFinalReturn;
  }

  async emailNewsletter(data: EmailNewsletterDTO) {
    const isSubscried = await this.prisma.emailsNewsletter.findFirst({
      where: {
        email: data.email,
      },
    });
    if (isSubscried) {
      throw new BadRequestException('Email already subscried', {
        cause: new Error(),
        description: `Email: ${data.email}`,
      });
    }
    await this.prisma.emailsNewsletter.create({
      data: {
        email: data.email,
      },
    });

    await this.emailSenderService.emailNewsletter(data.email);
  }

  async emailSaasMVPNewsletter(data: EmailSaaSMVPDTO) {
    await this.emailSenderService.emailSaasMVPNewsletter(
      data.email,
      data.feedback,
    );
  }

  //Volta informações do user através do sessionToken.
  async getCurrentUser(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    const userFinalReturn = {
      email: user.email,
      nome: user.nome,
      sobrenome: user.sobrenome,
      timestampContaCriada: user.timestampContaCriada,
      address: user.address,
      usdcAmount: user.usdcAmount,
      emailConfirmado: user.emailConfirmado,
      accountVerified: user.accountVerified,
      verified2FA: user.verified2FA,
      use2FA: user.use2FA,
      createdAt: user.criadoEm,
      nomeEmpresa: user.nomeEmpresa,
      CNPJ: user.cnpj,
      isBorrower: user.isBorrower,
      tipoNegocio: user.tipoNegocio,
      sobre: user.sobre,
      isAdmin: user.isAdmin,
    };

    return userFinalReturn;
  }

  //Volta balance do user.
  async getUserBalance(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    return Number(user.usdcAmount) / 10 ** 4;
  }

  async getIsUserMultiSign(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    return user.isMultiSign;
  }

  async getIsKYCedAnd2FA(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.use2FA || !user.accountVerified) {
      return false;
    } else {
      return true;
    }
  }

  async getIsKYCed(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.accountVerified) {
      return false;
    } else {
      return true;
    }
  }

  //criação token 2fa para user:
  async criarToken2FA(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (user.verified2FA) {
      throw new BadRequestException('2FA auth', {
        cause: new Error(),
        description: 'User already create a 2FA auth',
      });
    }

    const secret = speakeasy.generateSecret({
      name: 'Scalable',
    });

    const cipherEth = this.simpleCryptoJs.encrypt(secret.ascii);

    await this.prisma.usuario.update({
      where: {
        id: user.id,
      },
      data: {
        verified2FA: false,
        secret2FA: cipherEth,
      },
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    const obj = {
      qrCodeDataUrl: qrCodeDataUrl,
      codeUrl: secret.base32,
    };
    return obj;
  }

  //verificação da criação token 2fa para user:
  async verificarToken2FA(data: any, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (user.verified2FA) {
      throw new BadRequestException('2FA auth', {
        cause: new Error(),
        description: 'User already authenticated',
      });
    }

    await this.verify2FAAuth(user.secret2FA, data.token2FA);

    await this.prisma.usuario.update({
      where: {
        id: user.id,
      },
      data: {
        verified2FA: true,
        use2FA: true,
      },
    });

    return true;
  }

  async use2FA(data: any) {
    const user = await this.prisma.usuario.findFirst({
      where: {
        email: data.email,
      },
    });

    return user.use2FA;
  }

  async deactivate2FA(data: any, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    await this.verify2FAAuth(user.secret2FA, data.token2FA);

    await this.prisma.usuario.update({
      where: {
        id: user.id,
      },
      data: {
        verified2FA: false,
        use2FA: false,
      },
    });
  }

  //verificar se user fez o kyc pela metamask:
  async isUserMetamaskKYCed() {
    /*
        const walletEther = new ethers.Wallet(viewPrivateKey)
        const connectedWallet = walletEther.connect(web3Provider)
        const newcontract = new ethers.Contract(kycAddress, kycABI, web3Provider)

        
        const contractSigner = await newcontract.connect(connectedWallet);


        let isKYCed;
        const transact = await contractSigner.currentlyAccredited(req.params.address).then(function (response) {
            isKYCed = response;
        });

        return(isKYCed)
  */
    return true;
  }

  async allowanceFromUserMetamask(data: any) {
    const walletEther = new ethers.Wallet(this.viewPrivateKey);
    const connectedWallet = walletEther.connect(this.web3Provider);

    const newcontract = new ethers.Contract(
      this.usdcAddress,
      erc20ABI,
      this.web3Provider,
    );
    const contractSigner = await newcontract.connect(connectedWallet);

    const transact = await contractSigner.allowance(
      data.address,
      data.contract,
    );
    return parseInt(data.amount) < parseInt(transact);
  }

  async uploadFiles(
    data: any,
    files: Array<Express.Multer.File>,
    req: Request,
  ): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    //verificando se o user já tem na db o modelo de files:
    const usuarioFilesExiste =
      await this.prisma.arquivosUploadUsuario.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
    if (!usuarioFilesExiste) {
      await this.prisma.arquivosUploadUsuario.create({
        data: {
          usuarioId: user.id,
        },
      });
    }

    const usuarioFile = await this.prisma.arquivosUploadUsuario.findFirst({
      where: {
        usuarioId: user.id,
      },
    });
    //verificando se já não passou do limite de 5 arquivos por tipo:
    if (data.tipo === 'outrosFiles') {
      if (usuarioFile.outrosFiles.length + files.length > 15) {
        throw new BadRequestException('Upload exceeds 15 files', {
          cause: new Error(),
          description: 'Upload exceeds 15 files',
        });
      }
    } else {
      throw new BadRequestException('Select the outrosFiles type', {
        cause: new Error(),
        description: 'Select the outrosFiles type',
      });
    }

    if (files) {
      for (const file of files) {
        console.log('File found, trying to upload...');
        let fileName = '';
        try {
          const time = new Date().toJSON().slice(0, 10).replace(/-/g, '/');
          fileName = `${uuid()}-${file.originalname}`;
          const thisNameUUIDAlreadyExist =
            await this.awsBucketService.verifyIfFileExists(fileName);
          if (thisNameUUIDAlreadyExist)
            throw new BadRequestException('Upload erro', {
              cause: new Error(),
            });
          await this.googleBucketService.uploadFileBucket(fileName, file);
        } catch (err) {
          this.logService.createErrorLog(
            'uploadFiles',
            JSON.stringify(err),
            JSON.stringify(err['response']['data']),
            JSON.stringify(fileName),
            undefined,
            user.id,
          );
          console.log(err);
          throw new BadRequestException('Upload erro', {
            cause: new Error(),
            description: err,
          });
        }

        const url = `${fileName}`; //url:https://storage.cloud.google.com/${bucket.name}/${fileName}?authuser=6
        if (data.tipo === 'subscricoesFiles') {
          usuarioFile.subscricoesFiles.push(url);
        } else if (data.tipo === 'bancarioFiles') {
          usuarioFile.bancarioFiles.push(url);
        } else if (data.tipo === 'contabilFiles') {
          usuarioFile.contabilFiles.push(url);
        } else {
          usuarioFile.outrosFiles.push(url);
        }
        await this.prisma.arquivosUploadUsuario.update({
          where: {
            usuarioId: user.id,
          },
          data: {
            ...usuarioFile,
          },
        });
      }
      //escrevendo no sheets os links dos arquivos:
      const allFiles = await this.prisma.arquivosUploadUsuario.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
      if (allFiles.outrosFiles) {
        const finalValuesArray = [];
        for (let i = 0; i < allFiles.outrosFiles.length; i++) {
          const bucketName = await this.googleBucketService.getBucketName();
          const value = [
            `https://storage.cloud.google.com/${bucketName}/${allFiles.outrosFiles[i]}?authuser=6`,
          ];
          finalValuesArray.push(value);
        }
        const arrayHeaders = ['arquivos'];
        finalValuesArray.unshift(arrayHeaders);
        this.googleSheetsService.writeSheet(
          user.id,
          finalValuesArray,
          'arquivos',
        );
      }
      this.emailSenderService.emailNovoUploadArquivos(user.email);
    }
  }

  async uploadFinancialFiles(
    data: UploadFinancialFilesDto,
    files: Array<Express.Multer.File>,
    req: Request,
  ): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);
    console.log(files);
    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    //verificando se o user já tem na db o modelo de files:
    const usuarioFilesExiste =
      await this.prisma.arquivosUploadUsuario.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
    if (!usuarioFilesExiste) {
      await this.prisma.arquivosUploadUsuario.create({
        data: {
          usuarioId: user.id,
        },
      });
    }

    const usuarioFile = await this.prisma.arquivosUploadUsuario.findFirst({
      where: {
        usuarioId: user.id,
      },
    });

    //verificando se o user já não realizou o upload de um arquivo desse tipo:
    const tipo = data.tipo;
    if (usuarioFile[tipo].length > 0) {
      throw new BadRequestException('Upload exceeds 1 file', {
        cause: new Error(),
        description: 'Upload exceeds 1 file',
      });
    }

    if (files) {
      for (const file of files) {
        console.log('File found, trying to upload...');
        let fileName = '';
        try {
          fileName = `${uuid()}-${file.originalname}`;
          const thisNameUUIDAlreadyExist =
            await this.awsBucketService.verifyIfFileExists(fileName);
          if (thisNameUUIDAlreadyExist)
            throw new BadRequestException('Upload erro', {
              cause: new Error(),
            });
          // await this.googleBucketService.uploadFileBucket(fileName, file);
          await this.awsBucketService.uploadFileBucket(fileName, file);
        } catch (err) {
          this.logService.createErrorLog(
            'uploadFiles',
            JSON.stringify(err),
            JSON.stringify(err['response']['data']),
            JSON.stringify(fileName),
            undefined,
            user.id,
          );
          console.log(err);
          throw new BadRequestException('Upload erro', {
            cause: new Error(),
            description: err,
          });
        }

        const url = `${fileName}`; //url:https://storage.cloud.google.com/${bucket.name}/${fileName}?authuser=6
        usuarioFile[tipo].push(url);
        await this.prisma.arquivosUploadUsuario.update({
          where: {
            usuarioId: user.id,
          },
          data: {
            ...usuarioFile,
          },
        });
      }
      //escrevendo no sheets os links dos arquivos:
      const allFiles = await this.prisma.arquivosUploadUsuario.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
      if (allFiles.outrosFiles) {
        const finalValuesArray = [];
        for (let i = 0; i < allFiles.outrosFiles.length; i++) {
          const bucketName = await this.googleBucketService.getBucketName();
          const value = [
            `https://storage.cloud.google.com/${bucketName}/${allFiles.outrosFiles[i]}?authuser=6`,
          ];
          finalValuesArray.push(value);
        }
        const arrayHeaders = ['arquivos'];
        finalValuesArray.unshift(arrayHeaders);
        this.googleSheetsService.writeSheet(
          user.id,
          finalValuesArray,
          'arquivos',
        );
      }
      this.emailSenderService.emailNovoUploadArquivos(user.email);
    }
  }

  async uploadFinancialStrings(
    data: UploadFinancialStringsDto,
    req: Request,
  ): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    //verificando se o user já tem na db o modelo de files:
    const usuarioFilesExiste =
      await this.prisma.arquivosUploadUsuario.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
    if (!usuarioFilesExiste) {
      await this.prisma.arquivosUploadUsuario.create({
        data: {
          usuarioId: user.id,
        },
      });
    }

    const usuarioFile = await this.prisma.arquivosUploadUsuario.findFirst({
      where: {
        usuarioId: user.id,
      },
    });

    //verificando se o user já não realizou o upload de um arquivo desse tipo:
    const tipo = data.tipo;
    console.log(tipo);
    if (usuarioFile[tipo].length > 0) {
      throw new BadRequestException('Upload exceeds 1 file', {
        cause: new Error(),
        description: 'Upload exceeds 1 file',
      });
    }
    console.log('File found, trying to upload...');
    let fileName = '';
    try {
      const time = new Date().toJSON().slice(0, 10).replace(/-/g, '/');
      fileName = `${uuid()}-${data.url}`;
      const thisNameUUIDAlreadyExist =
        await this.awsBucketService.verifyIfFileExists(fileName);
      if (thisNameUUIDAlreadyExist)
        throw new BadRequestException('Upload erro', {
          cause: new Error(),
        });
      // await
      // await this.googleBucketService.uploadFileBucket(fileName, file);
      await this.awsBucketService.uploadStringBucket(fileName, data.url);
    } catch (err) {
      this.logService.createErrorLog(
        'uploadFiles',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(fileName),
        undefined,
        user.id,
      );
      console.log(err);
      throw new BadRequestException('Upload erro', {
        cause: new Error(),
        description: err,
      });
    }

    const url = `${fileName}`; //url:https://storage.cloud.google.com/${bucket.name}/${fileName}?authuser=6
    usuarioFile[tipo].push(url);
    await this.prisma.arquivosUploadUsuario.update({
      where: {
        usuarioId: user.id,
      },
      data: {
        ...usuarioFile,
      },
    });
    this.emailSenderService.emailNovoUploadArquivos(user.email);
  }

  async getFileBuffer(data: any, req: Request): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this request',
      });

    const res = await this.awsBucketService.getFileBuffer(data.fileName);
    return res;
  }

  //retorna todos os arquivos financeiros do user anexados na plataforma
  async getFinancialFiles(req: Request): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const arrayFiles = [];
    //verificando se o user já tem na db o modelo de files:
    const usuarioFilesExiste =
      await this.prisma.arquivosUploadUsuario.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
    const tipos = [
      'subscricoesFiles',
      'bancarioFiles',
      'contabilFiles',
      'outrosFiles',
      'balancoPatrimonial',
      'dre',
      'demonstracaoDeFluxoDeCaixa',
      'declaracaoFaturamentoUltimos12Meses',
      'orcamentoAnualEProjecao',
      'relatorioMetricasFinanceirasEOperacionais',
      'historicoDeCredito',
      'contratosClientesEFornecedores',
    ];
    if (usuarioFilesExiste) {
      tipos.map((tipo) => {
        for (let i = 0; i < usuarioFilesExiste[tipo].length; i++) {
          const obj = {
            id: usuarioFilesExiste[tipo][i],
            name: usuarioFilesExiste[tipo][i],
            tipo,
          };
          arrayFiles.push(obj);
        }
      });
    }
    return arrayFiles;
  }

  async getFiles(req: Request): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const arrayFiles = [];
    //verificando se o user já tem na db o modelo de files:
    const usuarioFilesExiste =
      await this.prisma.arquivosUploadUsuario.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
    if (usuarioFilesExiste.outrosFiles) {
      for (let i = 0; i < usuarioFilesExiste.outrosFiles.length; i++) {
        const obj = {
          id: usuarioFilesExiste.outrosFiles[i],
          name: usuarioFilesExiste.outrosFiles[i],
        };
        arrayFiles.push(obj);
      }
    }

    return arrayFiles;
  }

  async deleteFinancialUploadedFile(
    data: DeletarFinancialUploadedFile,
    req: Request,
  ): Promise<any> {
    console.log('cheguei aqui');
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    //verificando se o arquivo que o user deseja deletar existe e, se existe, deletar:
    const usuarioFilesExiste =
      await this.prisma.arquivosUploadUsuario.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
    const tipo = data.tipo;
    console.log(usuarioFilesExiste);
    if (!usuarioFilesExiste[tipo].includes(data.fileName)) {
      throw new BadRequestException('Este file não existe', {
        cause: new Error(),
        description: 'Este file não existe',
      });
    } else {
      await this.awsBucketService.deleteFileBucket(data.fileName);
      console.log('arquivo deletado com sucesso');
      const fileArray = usuarioFilesExiste[tipo].filter(
        (item) => item !== data.fileName,
      );

      await this.prisma.arquivosUploadUsuario.update({
        where: {
          usuarioId: user.id,
        },
        data: {
          [tipo]: fileArray,
        },
      });
      //escrevendo no sheets os links dos arquivos:
      const allFiles = await this.prisma.arquivosUploadUsuario.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
      if (allFiles[tipo]) {
        const finalValuesArray = [];
        for (let i = 0; i < allFiles[tipo].length; i++) {
          const bucketName = await this.googleBucketService.getBucketName();
          const value = [
            `https://storage.cloud.google.com/${bucketName}/${allFiles[tipo][i]}?authuser=6`,
          ];
          finalValuesArray.push(value);
        }
        const arrayHeaders = ['arquivos'];
        finalValuesArray.unshift(arrayHeaders);
        this.googleSheetsService.writeSheet(
          user.id,
          finalValuesArray,
          'arquivos',
        );
      }
    }
  }

  async deleteUploadedFile(
    data: DeletarUploadedFile,
    req: Request,
  ): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    //verificando se o arquivo que o user deseja deletar existe:
    const usuarioFilesExiste =
      await this.prisma.arquivosUploadUsuario.findFirst({
        where: {
          usuarioId: user.id,
        },
      });
    if (data.tipo === 'subscricoesFiles') {
      if (!usuarioFilesExiste.subscricoesFiles.includes(data.fileName)) {
        throw new BadRequestException('Este file não existe', {
          cause: new Error(),
          description: 'Este file não existe',
        });
      } else {
        await this.googleBucketService.deleteFileBucket(data.fileName);
        console.log('arquivo deletado com sucesso');
        const fileArray = usuarioFilesExiste.subscricoesFiles.filter(
          (item) => item !== data.fileName,
        );

        await this.prisma.arquivosUploadUsuario.update({
          where: {
            usuarioId: user.id,
          },
          data: {
            subscricoesFiles: fileArray,
          },
        });
      }
    } else if (data.tipo === 'bancarioFiles') {
      if (!usuarioFilesExiste.bancarioFiles.includes(data.fileName)) {
        throw new BadRequestException('Este file não existe', {
          cause: new Error(),
          description: 'Este file não existe',
        });
      } else {
        await this.googleBucketService.deleteFileBucket(data.fileName);
        console.log('arquivo deletado com sucesso');
        const fileArray = usuarioFilesExiste.bancarioFiles.filter(
          (item) => item !== data.fileName,
        );

        await this.prisma.arquivosUploadUsuario.update({
          where: {
            usuarioId: user.id,
          },
          data: {
            bancarioFiles: fileArray,
          },
        });
      }
    } else if (data.tipo === 'contabilFiles') {
      if (!usuarioFilesExiste.contabilFiles.includes(data.fileName)) {
        throw new BadRequestException('Este file não existe', {
          cause: new Error(),
          description: 'Este file não existe',
        });
      } else {
        await this.googleBucketService.deleteFileBucket(data.fileName);
        console.log('arquivo deletado com sucesso');
        const fileArray = usuarioFilesExiste.contabilFiles.filter(
          (item) => item !== data.fileName,
        );

        await this.prisma.arquivosUploadUsuario.update({
          where: {
            usuarioId: user.id,
          },
          data: {
            contabilFiles: fileArray,
          },
        });
      }
    } else {
      if (!usuarioFilesExiste.outrosFiles.includes(data.fileName)) {
        throw new BadRequestException('Este file não existe', {
          cause: new Error(),
          description: 'Este file não existe',
        });
      } else {
        await this.googleBucketService.deleteFileBucket(data.fileName);
        console.log('arquivo deletado com sucesso');
        const fileArray = usuarioFilesExiste.outrosFiles.filter(
          (item) => item !== data.fileName,
        );

        await this.prisma.arquivosUploadUsuario.update({
          where: {
            usuarioId: user.id,
          },
          data: {
            outrosFiles: fileArray,
          },
        });
        //escrevendo no sheets os links dos arquivos:
        const allFiles = await this.prisma.arquivosUploadUsuario.findFirst({
          where: {
            usuarioId: user.id,
          },
        });
        if (allFiles.outrosFiles) {
          const finalValuesArray = [];
          for (let i = 0; i < allFiles.outrosFiles.length; i++) {
            const bucketName = await this.googleBucketService.getBucketName();
            const value = [
              `https://storage.cloud.google.com/${bucketName}/${allFiles.outrosFiles[i]}?authuser=6`,
            ];
            finalValuesArray.push(value);
          }
          const arrayHeaders = ['arquivos'];
          finalValuesArray.unshift(arrayHeaders);
          this.googleSheetsService.writeSheet(
            user.id,
            finalValuesArray,
            'arquivos',
          );
        }
      }
    }
  }

  //cria um novo dashboard financeiro, já armazenando dados de planilha(s) do google sheets.
  async createNewDashboardFromGoogleSheets(
    data: createNewDashboardFromGoogleSheetsDTO,
    req: Request,
  ): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    console.log('pegando info das planilhas');
    const dataSheets = [];
    for (let i = 0; i < data.sheets.length; i++) {
      const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials({ access_token: data.authToken });

      const finalData = await this.fetchDataGoogleSheets(
        {
          spreadsheetId: data.sheets[i].sheetId,
          sheetName: data.sheets[i].tableSheetName,
          dateRowStart: data.sheets[i].dateRowStart,
          dataColumnStart: data.sheets[i].dataColumnStart,
        },
        data.authToken,
      );
      const finalDataAsStrings = finalData.map((dataItem) =>
        JSON.stringify(dataItem),
      );

      //pegar o nome da planilha:
      const spreadsheetTitle = await this.getSpreadsheetName(
        data.authToken,
        data.sheets[i].sheetId,
      );

      const dataSheet = {
        data: finalDataAsStrings,
        spreadSheetId: data.sheets[i].sheetId,
        spreadSheetName: spreadsheetTitle, // Aqui está o nome da planilha
        spreadSheetTableName: data.sheets[i].tableSheetName,
      };

      dataSheets.push(dataSheet);
    }

    //criando o dashboard:
    const dashboard = await this.prisma.financialDashboard.create({
      data: {
        name: data.dashboardName,
        usuarioId: user.id,
        SheetsData: {
          create: dataSheets,
        },
      },
    });

    return dashboard;
  }

  //retorna todos os dashboards de um user:
  async getDashboardsFromUser(req: Request): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const dashboards = await this.prisma.financialDashboard.findMany({
      where: {
        usuarioId: user.id,
      },
      include: {
        SheetsData: {
          select: {
            id: true,
            spreadSheetId: true,
            spreadSheetName: true,
            spreadSheetTableName: true,
          },
        },
      },
    });
    return dashboards;
  }

  //retorna informações e métricas de um dashboard em específico:
  async getDashboard(data: GetDashboardDTO, req: Request): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const dashboard = await this.prisma.financialDashboard.findFirst({
      where: {
        id: data.id,
      },
      include: {
        SheetsData: true,
        ChartData: true,
      },
    });
    return dashboard;
  }

  //Cria um novo gráfico para o dashboard:
  async createNewChartForDashboard(
    data: CreateChartForDashboardDTO,
    req: Request,
  ): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const dashboardExists = await this.prisma.financialDashboard.findFirst({
      where: {
        id: data.id,
        usuarioId: user.id,
      },
    });

    if (!dashboardExists)
      throw new BadRequestException('Dashboard Financial', {
        cause: new Error(),
        description: 'This dashboard does not exist',
      });
    const newChart = await this.prisma.chartData.create({
      data: {
        financialDashboardId: data.id,
        chartName: data.chartName,
        metricsName: data.metricsName,
        data: JSON.stringify(data.data),
      },
    });

    return newChart;
  }

  //Deleta um chart de um dashboard
  async deleteChartForDashboard(
    data: DeleteChartForDashboardDTO,
    req: Request,
  ): Promise<any> {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const chartExists = await this.prisma.chartData.findFirst({
      where: {
        id: data.id,
      },
      include: {
        financialDashboard: true,
      },
    });

    if (!chartExists || chartExists.financialDashboard.usuarioId !== user.id)
      throw new BadRequestException('Chart', {
        cause: new Error(),
        description: 'This chart does not exist',
      });

    const deletedChart = await this.prisma.chartData.delete({
      where: {
        id: data.id,
      },
    });

    return deletedChart;
  }

  //retorna todos os nomes das tabelas de uma sheet do google
  async getSheetTabNames(
    data: getTablesNameFromASheetsGoogle,
    req: Request,
  ): Promise<string[]> {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({ access_token: data.authToken });

    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

    try {
      const sheet = await sheets.spreadsheets.get({
        spreadsheetId: data.sheetId,
      });
      const tabNames = sheet.data.sheets.map((tab) => tab.properties.title);
      return tabNames;
    } catch (err) {
      console.log(err);
      throw new BadRequestException('Error getting sheets data', {
        cause: new Error(),
        description: 'Error getting sheets data',
      });
    }
  }

  async getDataFromACSVSheets(
    data: GetDataFromACSVSheetsDTO,
    files: Array<Express.Multer.File>,
    req: Request,
  ) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });
    return;
    //   // Assumindo que o arquivo é o primeiro da lista de arquivos
    //   const file = files[0];

    //   // Você pode usar o Papa Parse para analisar o arquivo CSV
    //   // O resultado será uma matriz de matrizes, onde cada matriz representa uma linha do arquivo CSV
    //   const parsedData = Papa.parse(file.buffer.toString(), { header: false });

    //   console.log('a planilha');
    //   console.log(parsedData.data);

    //   const finalData = await this.fetchDataCSV({
    //     data: parsedData.data,
    //     sheetName: data.tableSheetName,
    //     dateRowStart: data.dateRowStart,
    //     dataColumnStart: data.dataColumnStart,
    //   });
    //   const finalDataAsStrings = finalData.map((dataItem) =>
    //     JSON.stringify(dataItem),
    //   );

    //   await this.prisma.sheetsData.create({
    //     data: {
    //       data: finalDataAsStrings,
    //       spreadSheetName: file.originalname, // Aqui está o nome da planilha
    //       spreadSheetTableName: data.tableSheetName,
    //     },
    //   });
    //   return finalData;
  }
  async setStepOnboarding(data: SetStepOnboardingDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const updated = await this.prisma.usuario.update({
      where: {
        id: user.id,
      },
      data: {
        onBoardingSteps: data.step,
      },
    });
    return updated;
  }

  async getStepOnboarding(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const updated = await this.prisma.usuario.findFirst({
      where: {
        id: user.id,
      },
    });
    return { step: updated.onBoardingSteps };
  }

  //**FUNÇÕES */

  //Retorna os dados tratados de uma sheets em específico do google sheets;
  async fetchDataGoogleSheets(
    options: FetchDataGoogleSheetsOptions,
    authToken: string,
  ) {
    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({ access_token: authToken });
    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

    console.log('esses são os dados enviados pelo user');
    console.log(options);

    const dataRange = `${options.sheetName}!A1:Z1000`; // Altere de acordo com a sua necessidade
    console.log('realizando o fetch');
    let res;
    try {
      res = await sheets.spreadsheets.values.get({
        spreadsheetId: options.spreadsheetId,
        range: dataRange,
      });
    } catch (err) {
      console.log(err);
      throw new Error('OAuth error');
    }
    console.log('recebi a minha res');
    console.log(res.data);
    const rows = res.data.values;

    console.log('os dados das rows:');
    console.log(rows);

    if (rows) {
      const metrics = {};

      const dateStartRow = Number(options.dateRowStart) - 1; // transforma a string em número e ajusta para indexação baseada em zero
      const dataStartCol = this.columnToNumber(options.dataColumnStart) - 1; // transforma a coluna (letra) em número e ajusta para indexação baseada em zero

      const dates = rows[dateStartRow].slice(dataStartCol);
      console.log('após os dates slice:');
      console.log(dates);
      for (let i = dateStartRow + 1; i < rows.length; i++) {
        // começa a partir da linha seguinte à das datas
        const row = rows[i];
        const metric = row[dataStartCol];
        const data = row.slice(dataStartCol);

        metrics[metric] = {};

        for (let j = 0; j < dates.length; j++) {
          // se a data estiver em branco, pare o loop
          if (!dates[j]) {
            continue;
          }
          // Checar se data[j] é um número de forma mais estrita
          if (isNaN(Number(data[j]))) {
            metrics[metric][dates[j]] = 0;
          } else {
            metrics[metric][dates[j]] = data[j];
          }
        }
      }

      const result = [];

      for (const metric in metrics) {
        const obj = {};
        obj[metric] = metrics[metric];
        result.push(obj);
      }
      console.log('as metriccc');
      console.log(result);
      return result;
    } else {
      throw new Error('No data found.');
    }
  }

  //Retorna os dados tratados de uma sheets em específico do csv;
  async fetchDataCSV(options: FetchDataCSVOptions) {
    return;
    // const rows = options.data;
    // if (rows.length > 0) {
    //   const metrics = {};

    //   const dateStart = this.cellToRowCol(options.dateRowStart);
    //   const dataStart = this.cellToRowCol(options.dataColumnStart);

    //   const dates = rows[dateStart.row].slice(dateStart.col);

    //   for (let i = dataStart.row; i < rows.length; i++) {
    //     const row = rows[i];
    //     const metric = row[dataStart.col];
    //     const data = row.slice(dateStart.col);

    //     metrics[metric] = {};

    //     for (let j = 0; j < dates.length; j++) {
    //       // este if é para garantir que se um dos campos da data esteja vazio ele para o looping, se não quiser essa feature, só remover esse if.
    //       if (!dates[j]) {
    //         break;
    //       }
    //       metrics[metric][dates[j]] = data[j];
    //     }
    //   }

    //   const result = [];

    //   for (const metric in metrics) {
    //     const obj = {};
    //     obj[metric] = metrics[metric];
    //     result.push(obj);
    //   }

    //   console.log('result final');
    //   console.log(result);
    //   return result;
    // } else {
    //   throw new Error('No data found.');
    // }
  }

  colToNumber(colRef: string) {
    let col = 0;
    for (let i = 0; i < colRef.length; i++) {
      col +=
        (colRef.toUpperCase().charCodeAt(i) - 64) *
        Math.pow(26, colRef.length - i - 1);
    }
    return col;
  }

  cellToRowCol(rowRef: string, colRef: string) {
    const row = parseInt(rowRef, 10);
    const col = this.colToNumber(colRef);

    return { row: row - 1, col: col - 1 }; // Ajuste para indexação baseada em zero
  }

  columnToNumber(col: string) {
    let column = 0;
    for (let i = 0; i < col.length; i++) {
      column += (col.charCodeAt(i) - 64) * Math.pow(26, col.length - i - 1);
    }
    return column;
  }

  async getSpreadsheetName(
    authToken: string,
    spreadsheetId: string,
  ): Promise<string> {
    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({ access_token: authToken });

    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    return response.data.properties.title; // Aqui está o nome da planilha
  }

  async criarWalletTatum() {
    const id = crypto.randomBytes(32);
    const id2 = id.toString('hex');
    const privateKey = '0x' + id2;

    const wallet = new ethers.Wallet(privateKey);
    const final = {
      address: wallet.address,
      walletId: privateKey,
    };

    return final;
  }

  async verify2FAAuth(secret, token) {
    const cipherEth = this.simpleCryptoJs.decrypt(secret);

    const verified = speakeasy.totp.verify({
      secret: cipherEth,
      enconding: 'ascii',
      token: token,
    });
    if (!verified) {
      throw new BadRequestException('2FA auth', {
        cause: new Error(),
        description: 'Invalid 2FA key',
      });
    }
    return verified;
  }

  async verifySessionToken(accessToken: string) {
    let user;
    try {
      const tokenValido = await this.jwtService.verifyAsync(accessToken);
      user = await this.prisma.usuario.findFirst({
        where: {
          id: tokenValido.id,
        },
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Invalid session token', {
        cause: new Error(),
        description: 'Invalid session token',
      });
    }
    return user;
  }

  async checkBankingAPIsUpdate(userId: string) {
    const user = await this.prisma.usuario.findFirst({
      where: {
        id: userId,
      },
    });

    //1º verificação - Netsuite:
    if (user.codatId && user.codatNetsuiteId) {
      const userNetsuite =
        await this.prisma.netsuiteCodatAPIConnection.findFirst({
          where: {
            usuarioId: user.id,
          },
        });

      if (userNetsuite.updateTimestamp) {
        if (
          Number(userNetsuite.updateTimestamp) <
          Math.round(Date.now() / 1000) - 2678400
        ) {
          await this.prisma.netsuiteCodatAPIConnection.update({
            where: {
              usuarioId: user.id,
            },
            data: {
              isUpdated: false,
            },
          });
        }
      }
    }

    //2º verificação - ContaAzul:
    const userContaAzul = await this.prisma.contaAzulAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });
    if (userContaAzul) {
      if (userContaAzul.updateTimestamp) {
        if (
          Number(userContaAzul.updateTimestamp) <
          Math.round(Date.now() / 1000) - 2678400
        ) {
          await this.prisma.contaAzulAPIConnection.update({
            where: {
              usuarioId: user.id,
            },
            data: {
              isUpdated: false,
            },
          });
        }
      }
    }

    //3º verificação - Omie:
    const userOmie = await this.prisma.omieAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });
    if (userOmie) {
      if (userOmie.updateTimestamp) {
        if (
          Number(userOmie.updateTimestamp) <
          Math.round(Date.now() / 1000) - 2678400
        ) {
          await this.prisma.omieAPIConnection.update({
            where: {
              usuarioId: user.id,
            },
            data: {
              isUpdated: false,
            },
          });
        }
      }
    }

    //4º verificação - Vindi:
    const userVindi = await this.prisma.vindiAPIConnection.findFirst({
      where: {
        usuarioId: user.id,
      },
    });
    if (userVindi) {
      if (userVindi.updateTimestamp) {
        if (
          Number(userVindi.updateTimestamp) <
          Math.round(Date.now() / 1000) - 2678400
        ) {
          await this.prisma.vindiAPIConnection.update({
            where: {
              usuarioId: user.id,
            },
            data: {
              isUpdated: false,
            },
          });
        }
      }
    }

    //5º verificação - Pluggy:
    const userPluggy = await this.prisma.pluggyAPIConnection.findMany({
      where: {
        usuarioId: user.id,
      },
    });
    if (userPluggy.length > 0) {
      for (let i = 0; i < userPluggy.length; i++) {
        if (userPluggy[i].updateTimestamp) {
          if (
            Number(userPluggy[i].updateTimestamp) <
            Math.round(Date.now() / 1000) - 2678400
          ) {
            await this.prisma.pluggyAPIConnection.update({
              where: {
                id: userPluggy[i].id,
              },
              data: {
                isUpdated: false,
              },
            });
          }
        }
      }
    }
  }

  async validarCNPJ(cnpj: any) {
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]+/g, '');

    // Verifica se possui 14 caracteres numéricos
    if (cnpj.length !== 14) {
      return false;
    }

    // Verifica se todos os caracteres são iguais (ex: 00000000000000)
    if (/^(\d)\1+$/.test(cnpj)) {
      return false;
    }

    // Verifica a validade do primeiro dígito verificador
    let soma = 0;
    let peso = 2;
    for (let i = 11; i >= 0; i--) {
      soma += cnpj.charAt(i) * peso;
      peso = (peso + 1) % 10 || 2;
    }
    const dv1 = 11 - (soma % 11);
    if (dv1 > 9) {
      if (cnpj.charAt(12) != '0') {
        return false;
      }
    } else {
      if (cnpj.charAt(12) != dv1) {
        return false;
      }
    }

    // Verifica a validade do segundo dígito verificador
    soma = 0;
    peso = 2;
    for (let i = 12; i >= 0; i--) {
      soma += cnpj.charAt(i) * peso;
      peso = (peso + 1) % 10 || 2;
    }
    const dv2 = 11 - (soma % 11);
    if (dv2 > 9) {
      if (cnpj.charAt(13) != '0') {
        return false;
      }
    } else {
      if (cnpj.charAt(13) != dv2) {
        return false;
      }
    }

    return true;
  }

  //função para esperar x milisegundos até prosseguir o código:
  async wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }

  // async test(req: Request) {
  //   console.log('webhook chamado com sucesso');
  //   // console.log(networkInfo.lo[0].address);
  //   console.log('headers:');
  //   console.log(req.headers['x-forwarded-for']);
  //   console.log(req.headers['x-forwarded-for'][0]);
  //   console.log('oi');
  //   let ip;
  //   if (Array.isArray(req.headers['x-forwarded-for'])) {
  //     ip = req.headers['x-forwarded-for'][0];
  //   } else {
  //     ip = req.headers['x-forwarded-for']
  //       ? req.headers['x-forwarded-for'].split(',')[0]
  //       : req.connection.remoteAddress;
  //   }
  //   console.log(ip);
  //   const ipUser = req.headers['x-forwarded-for'][0];
  //   console.log('REQUESTED CLIENT IP: ', ipUser);

  //   const allowedIps = [
  //     '18.230.52.190',
  //     '18.229.96.107',
  //     '18.230.36.112',
  //     '54.156.209.67',
  //     '179.151.173.139',
  //   ];
  //   if (!allowedIps.includes(ip)) {
  //     console.log('erro chamado não pertence à genial');
  //     throw new BadRequestException('Ip bloqueado', {
  //       cause: new Error(),
  //       description: 'Ip que chamou webhookPix não é um ip permitido',
  //     });
  //   }
  //   console.log('genial chamado recebido com sucesso');
  //   return;
  // }
}
