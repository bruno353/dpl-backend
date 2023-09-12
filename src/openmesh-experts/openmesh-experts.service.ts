import {
  ConflictException,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

// import { import_ } from '@brillout/import';
import { ethers } from 'ethers';
import * as taskContractABI from '../contracts/taskContractABI.json';
import * as erc20ContractABI from '../contracts/erc20ContractABI.json';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { SimpleCrypto } from 'simple-crypto-js';

import * as tasksDraftContractABI from '../contracts/tasksDraftContractABI.json';
import * as nftContractABI from '../contracts/nftContractABI.json';
import * as tokenListGovernanceABI from '../contracts/tokenListGovernanceABI.json';

import { PrismaService } from '../database/prisma.service';
import { Request, response } from 'express';
import axios from 'axios';

import { UtilsService } from '../utils/utils.service';
import { CreateOpenmeshExpertUserDTO } from './dto/openmesh-experts.dto';

//This service is utilized to update all the governance workflow - it runs a query trhough all the events from the contracts governance to update it (its util to some cases in which the backend may have losed some events caused by a downtime or something similar)
@Injectable()
export class OpenmeshExpertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
  ) {}

  async createUser(data: CreateOpenmeshExpertUserDTO) {
    const results = await this.prisma.openmeshExpertUser.findFirst({
      where: {
        email: data.email,
      },
    });
    if (results) {
      //if an account was already create with this email but the email was not confirmed,  we delete the old account and create a new one.
      if (
        results.confirmedEmail === false &&
        Number(results.timestampContaCriada) + 86400 <
          Math.round(Date.now() / 1000)
      ) {
        await this.prisma.usuario.delete({
          where: {
            email: data.email,
          },
        });
      }
      //if an account was already create with this email in less than 24 hours, we do not let it create another one.
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
      //If email is already in use:
      else if (results.emailConfirmado === true) {
        throw new BadRequestException('Email already in use', {
          cause: new Error(),
          description: 'Email already in use',
        });
      }
    }

    //generating password:
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
}
