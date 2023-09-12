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

import { JwtService } from '@nestjs/jwt';

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
import {
  CreateOpenmeshExpertUserDTO,
  LoginDTO,
} from './dto/openmesh-experts-auth.dto';

//This service is utilized to update all the governance workflow - it runs a query trhough all the events from the contracts governance to update it (its util to some cases in which the backend may have losed some events caused by a downtime or something similar)
@Injectable()
export class OpenmeshExpertsAuthService {
  constructor(
    private readonly jwtService: JwtService,
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
        Math.round(Number(results.createdAt) / 1000) + 86400 <
          Math.round(Date.now() / 1000)
      ) {
        await this.prisma.openmeshExpertUser.delete({
          where: {
            email: data.email,
          },
        });
      }
      //if an account was already create with this email in less than 24 hours, we do not let it create another one.
      else if (
        results.confirmedEmail === false &&
        Math.round(Number(results.createdAt) / 1000) + 86400 >=
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
      else if (results.confirmedEmail) {
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

    const { password, ...rest } = data;

    const response = await this.prisma.openmeshExpertUser.create({
      data: {
        password: hashedPassword,
        hashConfirmEmail: id2,
        confirmedEmail: true,
        ...rest,
      },
    });

    const jwt = await this.jwtService.signAsync({ id: response.id });

    // await this.emailSenderService.emailConfirmacaoConta(id2, data.email);

    const userFinalReturn = {
      email: response.email,
      sessionToken: jwt,
    };

    //this.financeService.KYBBigData(response.id);
    return userFinalReturn;
  }

  async login(data: LoginDTO) {
    const user = await this.prisma.openmeshExpertUser.findFirst({
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

    if (!user.confirmedEmail)
      throw new BadRequestException('Unconfirmed Email', {
        cause: new Error(),
        description: 'Unconfirmed Email',
      });
    if (!user.userEnabled)
      throw new BadRequestException('User disabled', {
        cause: new Error(),
        description: 'User disabled',
      });

    const jwt = await this.jwtService.signAsync({ id: user.id });

    const userFinalReturn = {
      email: user.email,
      name: user.name,
      companyName: user.companyName,
      location: user.location,
      description: user.description,
      foundingYear: user.foundingYear,
      website: user.website,
      tags: user.tags,
      calendly: user.scheduleCalendlyLink,
      profilePictureHash: user.profilePictureHash,
      confirmedEmail: user.confirmedEmail,
      sessionToken: jwt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return userFinalReturn;
  }
}
