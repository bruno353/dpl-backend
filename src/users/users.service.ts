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
import { createHash } from 'crypto';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import { PrismaService } from '../database/prisma.service';
import { Request, response } from 'express';
import axios from 'axios';
import { UtilsService } from '../utils/utils.service';
import { EditUserDTO, GetUserDTO } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
  ) {}

  //setting variables:
  web3UrlProvider = process.env.WEB3_URL_PROVIDER;
  web3Provider = new ethers.providers.JsonRpcProvider(this.web3UrlProvider);
  viewPrivateKey = process.env.VIEW_PRIVATE_KEY;
  taskContractAddress = process.env.TASK_CONTRACT_ADDRESS;
  ipfsBaseURL = process.env.IPFS_BASE_URL;
  pinataApiKey = process.env.PINATA_API_KEY;
  pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
  environment = process.env.ENVIRONMENT;
  usdcTokenAddress = process.env.USDC_TOKEN_ADDRESS;
  usdtTokenAddress = process.env.USDT_TOKEN_ADDRESS;
  wEthTokenAddress = process.env.WETH_TOKEN_ADDRESS;

  statusOptions = ['open', 'active', 'completed'];

  //gets the user and also its tasks / applications
  async getUser(data: GetUserDTO) {
    const userExists = await this.prisma.user.findFirst({
      where: {
        address: data.address,
      },
    });

    if (!userExists) {
      this.checkIfUserExistsOnTheChain(data.address);
      return userExists;
    } else {
      //if the user exists, searching for its applications tasks
      const applications = await this.prisma.application.findMany({
        where: {
          applicant: data.address,
        },
      });
      console.log('applica');
      console.log(applications);

      const taskIds = applications.map((application) => application.taskId);

      //getting the tasks and sorted:
      let orderBy = {};
      if (data.deadlineSorting && !data.estimatedBudgetSorting) {
        orderBy = {
          deadline: data.deadlineSorting === 'newest' ? 'desc' : 'asc',
        };
      }

      if (data.estimatedBudgetSorting) {
        orderBy = {
          estimatedBudget:
            data.estimatedBudgetSorting === 'greater' ? 'desc' : 'asc',
          ...orderBy, // Caso deadlineSorting também esteja definido, será de menor prioridade
        };
      }
      console.log('tass');
      console.log(taskIds);
      const tasks = await this.prisma.task.findMany({
        where: {
          taskId: {
            in: taskIds,
          },
        },
        orderBy,
      });

      // Incorporate the tasks into the response if needed
      userExists['tasks'] = tasks;

      return userExists;
    }
  }

  //Function for when the user is not registered yet on the database
  //Getting when the user joined on the protocol through the first interaction he had with the protocol
  //If he does not have any interaction, nothing happens.
  async checkIfUserExistsOnTheChain(address: string) {
    const userExists = await this.prisma.user.findFirst({
      where: {
        address,
      },
    });
    if (!userExists) {
      const getEvents = await this.prisma.event.findMany({
        where: {
          address,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });
      if (getEvents.length > 0) {
        await this.prisma.user.create({
          data: {
            address,
            joinedSince: getEvents[0].timestamp,
          },
        });
      }
    }
  }

  //To edit a user profile, its mandatory to check if the data to change the profile was signed by the user (message signing) to assure that its the user who wants to change its profile.
  //We create a hash with the data the user sent, the updatesNonce from the user and verifies if the signed messages matches the hash (with the address of the signer)
  async editUser(data: EditUserDTO) {
    const userExists = await this.prisma.user.findFirst({
      where: {
        address: data.address,
      },
    });

    if (!userExists) {
      const hash = this.hashObject(data);
      const isVerified = this.verifiesSignedMessage(
        hash,
        data.address,
        data.signature,
      );
      if (!isVerified) {
        throw new BadRequestException('Invalid signature', {
          cause: new Error(),
          description: 'Invalid signature',
        });
      }
      const { signature, nonce, ...finalData } = data;
      await this.prisma.user.create({
        data: finalData,
      });
    } else {
      if (data.nonce !== userExists.updatesNonce) {
        throw new BadRequestException('Invalid nonce', {
          cause: new Error(),
          description: 'Invalid nonce',
        });
      }
      const hash = this.hashObject(data);
      const isVerified = this.verifiesSignedMessage(
        hash,
        data.address,
        data.signature,
      );
      if (!isVerified) {
        throw new BadRequestException('Invalid signature', {
          cause: new Error(),
          description: 'Invalid signature',
        });
      }
      const { signature, nonce, ...finalData } = data;
      finalData['updatesNonce'] = String(Number(userExists.updatesNonce) + 1);
      await this.prisma.user.create({
        data: finalData,
      });
    }
  }

  async verifiesSignedMessage(
    hash: string,
    address: string,
    signature: string,
  ) {
    const signer = ethers.utils.recoverAddress(hash, signature);
    return signer === address;
  }

  //returns a hash to be signed
  hashObject(obj: any): string {
    const str = JSON.stringify(obj);
    const hash = createHash('sha256');
    hash.update(str);
    return hash.digest('hex');
  }
}
