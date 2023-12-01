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
  GetDatasetDTO,
  GetDatasetsDTO,
  UploadDatasetsDTO,
} from './dto/openmesh-data.dto';

//This service is utilized to update all the governance workflow - it runs a query trhough all the events from the contracts governance to update it (its util to some cases in which the backend may have losed some events caused by a downtime or something similar)
@Injectable()
export class OpenmeshDataService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
  ) {}

  async getDatasets(data: GetDatasetsDTO) {
    const datasets = await this.prisma.openmeshDataProviders.findMany({
      where: {
        ...data,
      },
    });
    return datasets;
  }

  async getDataset(data: GetDatasetDTO) {
    const dataset = await this.prisma.openmeshDataProviders.findFirst({
      where: {
        ...data,
      },
    });
    return dataset;
  }

  async uploadDatasets(dataBody: UploadDatasetsDTO[]) {
    const dataset = await this.prisma.openmeshDataProviders.createMany({
      data: dataBody,
    });
    return dataset;
  }

  async updateLinksDataProducts(dataBody: any) {
    for (let i = 0; i < dataBody.length; i++) {
      console.log('entrei');
      console.log(dataBody[i].Entity);
      await this.prisma.openmeshDataProviders.updateMany({
        where: {
          name: dataBody[i].Entity,
        },
        data: {
          linkDevelopersDocs: dataBody[i].Developers,
          linkProducts: dataBody[i].Products,
          linkCareers: dataBody[i].Careers,
          linkTwitter: dataBody[i].Twitter,
          linkContact: dataBody[i].Contact,
          linkAboutUs: dataBody[i]['About Us'],
          linkMedium: dataBody[i].Medium,
          linkLinkedin: dataBody[i].Linkedin,
          linkGithub: dataBody[i].Github,
        },
      });
      console.log('sai');
    }
  }
}
