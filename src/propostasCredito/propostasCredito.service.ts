import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ethers } from 'ethers';
import { SimpleCrypto } from 'simple-crypto-js';
import { join } from 'path';
import { Storage } from '@google-cloud/storage';
import { v4 as uuid } from 'uuid';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import { PrismaService } from '../database/prisma.service';

import { Request, response } from 'express';
import axios from 'axios';
import { GoogleBucketService } from 'src/internalFunctions/googleBucket.service';
import { EmailSenderService } from '../internalFunctions/emailSender.service';
import { AuthService } from 'src/auth/auth.service';
import { LogService } from '../internalFunctions/log.service';
import { CriarPropostaCreditoDTO } from './dto/criar-proposta-credito.dto';
import { DeletarPropostaCreditoDTO } from './dto/deletar-proposta-credito.dto';
import { GetPropostaDTO } from './dto/get-proposta.dto';
import { AWSBucketService } from 'src/internalFunctions/awsBucket.service';

@Injectable()
export class PropostasCreditoService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly googleBucketService: GoogleBucketService,
    private readonly emailSenderService: EmailSenderService,
    private readonly authService: AuthService,
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

  //**ENDPOINTS:**
  //Endpoints de utilidade à propostas de crédito.

  //cria uma nova proposta de credito para um user.
  async criarPropostaCredito(data: CriarPropostaCreditoDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const userFound = await this.prisma.usuario.findFirst({
      where: {
        id: data.userId,
      },
    });

    if (!userFound) {
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'User not found',
      });
    }

    const novaProposta = await this.prisma.propostasCredito.create({
      data: {
        usuarioId: data.userId,
        montanteProposto: data.montanteProposto,
        taxaJurosProposto: data.taxaJurosProposto,
        termoProposto: data.termoProposto,
      },
    });
    this.emailSenderService.emailNovaPropostaCreditoSubmetidaADM(
      user.email,
      userFound.email,
      novaProposta,
    );
    this.emailSenderService.emailNovaPropostaCreditoSubmetidaUser(
      userFound.email,
    );
    return novaProposta;
  }

  //deleta uma proposta de credito para um user.
  async deletarPropostaCredito(data: DeletarPropostaCreditoDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    //verificar se existe propostaCredito:
    const propostaFound = await this.prisma.propostasCredito.findFirst({
      where: {
        id: data.propostaId,
      },
    });

    if (!propostaFound) {
      throw new BadRequestException('Proposta', {
        cause: new Error(),
        description: 'Proposta wasnt found',
      });
    }

    await this.prisma.propostasCredito.delete({
      where: {
        id: data.propostaId,
      },
    });
  }

  async getPropostas(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const propostas = await this.prisma.propostasCredito.findMany();
    const propostasFinal = [];

    if (propostas) {
      for (let i = 0; i < propostas.length; i++) {
        const userCNPJ = await this.prisma.usuario.findFirst({
          where: {
            id: propostas[i].usuarioId,
          },
        });
        const propostaReturn = {
          id: propostas[i].id,
          usuarioId: propostas[i].usuarioId,
          CNPJ: userCNPJ.cnpj,
          montanteProposto: propostas[i].montanteProposto,
          taxaJurosProposto: propostas[i].taxaJurosProposto,
          termoProposto: propostas[i].termoProposto,
          montanteRequisitado: propostas[i].montanteRequisitado,
          propostaVisualizada: propostas[i].propostaVisualizada,
          propostaAberta: propostas[i].propostaAberta,
          propostaAceita: propostas[i].propostaAceita,
          criadoEm: propostas[i].criadoEm,
          atualizadoEm: propostas[i].atualizadoEm,
        };
        propostasFinal.push(propostaReturn);
      }
    }
    return propostasFinal;
  }

  async getProposta(data: GetPropostaDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const propostaFound = await this.prisma.propostasCredito.findFirst({
      where: {
        id: data.propostaId,
      },
    });

    if (!propostaFound) {
      throw new BadRequestException('Proposta', {
        cause: new Error(),
        description: 'Proposta not found',
      });
    }
    const propostaReturn = {
      id: propostaFound.id,
      usuarioId: propostaFound.usuarioId,
      montanteProposto: propostaFound.montanteProposto,
      taxaJurosProposto: propostaFound.taxaJurosProposto,
      termoProposto: propostaFound.termoProposto,
      montanteRequisitado: propostaFound.montanteRequisitado,
      propostaVisualizada: propostaFound.propostaVisualizada,
      propostaAberta: propostaFound.propostaAberta,
      propostaAceita: propostaFound.propostaAceita,
      criadoEm: propostaFound.criadoEm,
      atualizadoEm: propostaFound.atualizadoEm,
      ultimaModificacaoArquivosUpload: null,
      contratosUpload: [],
    };

    //vendo se ele possui arquivos-contratos que fez uploads:
    const contratosUpload =
      await this.prisma.arquivosContratosUploadUsuario.findFirst({
        where: {
          propostaCreditoId: data.propostaId,
        },
      });
    if (contratosUpload) {
      if (contratosUpload.urlFiles.length > 0) {
        const finalArquivos = [];
        for (let i = 0; i < contratosUpload.urlFiles.length; i++) {
          const myFile = `https://storage.cloud.google.com/storage-files-scalable/${contratosUpload.urlFiles[i]}?authuser=6`;
          finalArquivos.push(myFile);
        }
        propostaReturn.contratosUpload = finalArquivos;
      }
      propostaReturn.ultimaModificacaoArquivosUpload =
        propostaReturn.atualizadoEm;
    }

    return propostaReturn;
  }

  // Devolve, se existir, uma proposta de crédito ativa para o user
  async getPropostaCreditoOn(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const propostaFound = await this.prisma.propostasCredito.findMany({
      where: {
        usuarioId: user.id,
        propostaAberta: true,
        operacaoEmAndamento: false, //se a operação já está em andamento, não será mais mostrada a "proposta de crédito ao user"
      },
      orderBy: {
        criadoEm: 'asc',
      },
    });
    return propostaFound;
  }

  // Admin - Devolve, se existir, todas as propostas de creditos ativas dos users
  async getPropostaCreditoAberta(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    const propostaFound = await this.prisma.propostasCredito.findMany({
      where: {
        propostaAberta: true,
      },
      orderBy: {
        criadoEm: 'asc',
      },
    });
    return propostaFound;
  }

  // Endpoint para informar que proposta de crédito foi visualizada pelo usuário
  async propostaCreditoVisualizada(data: GetPropostaDTO, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const propostaFound = await this.prisma.propostasCredito.findFirst({
      where: {
        id: data.propostaId,
        usuarioId: user.id,
      },
    });
    if (!propostaFound) {
      throw new BadRequestException('Proposta not found', {
        cause: new Error(),
        description: 'Proposta was not found',
      });
    }

    const propostaUpdated = await this.prisma.propostasCredito.update({
      where: {
        id: data.propostaId,
      },
      data: {
        propostaVisualizada: true,
      },
    });
    this.emailSenderService.emailPropostaCreditoVisualizada(
      user.email,
      propostaUpdated,
    );
    return propostaUpdated;
  }

  // Endpoint para informar que caixa de mensagem de nova proposta de crédito foi mostrada para o usuário
  async propostaCreditoNovaMensagem(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const propostasFound = await this.prisma.propostasCredito.findMany({
      where: {
        usuarioId: user.id,
      },
    });
    if (!propostasFound) {
      throw new BadRequestException('Propostas not found', {
        cause: new Error(),
        description: 'Propostas was not found',
      });
    }

    const propostasUpdated = await this.prisma.propostasCredito.updateMany({
      where: {
        usuarioId: user.id,
      },
      data: {
        mensagemNovaProposta: false,
      },
    });
    return propostasUpdated;
  }

  async uploadFilesPropostaCredito(
    data: any,
    files: Array<Express.Multer.File>,
    req: Request,
  ): Promise<any> {
    console.log('recebi isto:');
    console.log(data);
    console.log(data.propostaId);
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });

    const propostaFound = await this.prisma.propostasCredito.findFirst({
      where: {
        id: data.propostaId,
        usuarioId: user.id,
      },
    });
    if (!propostaFound) {
      throw new BadRequestException('Proposta was not found', {
        cause: new Error(),
        description: 'Proposta was not found',
      });
    }
    if (
      new Decimal(data.montanteReq).greaterThan(
        new Decimal(propostaFound.montanteProposto),
      ) ||
      new Decimal(data.montanteReq).lessThanOrEqualTo(new Decimal(0))
    ) {
      throw new BadRequestException(
        'MontanteReq greater than montanteProposto',
        {
          cause: new Error(),
          description: 'MontanteReq greater than montanteProposto',
        },
      );
    }

    //verificando se o upload já não foi feito, caso sim, o user não pode mais fazer uploads.
    if (propostaFound.propostaAceita) {
      throw new BadRequestException('Files already uploaded', {
        cause: new Error(),
        description: 'Files already uploaded',
      });
    }

    //verificando se o user já tem na db o modelo de files:
    const usuarioFilesExiste =
      await this.prisma.arquivosContratosUploadUsuario.findFirst({
        where: {
          propostaCreditoId: data.propostaId,
        },
      });
    if (!usuarioFilesExiste) {
      await this.prisma.arquivosContratosUploadUsuario.create({
        data: {
          propostaCreditoId: data.propostaId,
        },
      });
    }

    const usuarioFile =
      await this.prisma.arquivosContratosUploadUsuario.findFirst({
        where: {
          propostaCreditoId: data.propostaId,
        },
      });

    //verificando se já não passou do limite de 25 arquivos por tipo:
    if (usuarioFile.urlFiles.length + files.length > 25) {
      throw new BadRequestException('Upload exceeds 25 files', {
        cause: new Error(),
        description: 'Upload exceeds 25 files',
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
          // await
          await this.googleBucketService.uploadFileBucket(fileName, file);
        } catch (err) {
          this.logService.createErrorLog(
            'uploadFilesContratos',
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
        usuarioFile.urlFiles.push(url);
        await this.prisma.arquivosContratosUploadUsuario.update({
          where: {
            propostaCreditoId: data.propostaId,
          },
          data: {
            ...usuarioFile,
          },
        });
      }
    }
    //após fazer o upload de arquivos, significa que a proposta foi aceita pelo o user:
    const propostaUpdated = await this.prisma.propostasCredito.update({
      where: {
        id: data.propostaId,
      },
      data: {
        propostaAceita: true,
        montanteRequisitado: data.montanteReq,
      },
    });
    this.emailSenderService.emailPropostaCreditoAceita(
      user.email,
      propostaUpdated,
    );
  }

  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
