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
import * as tasksDraftContractABI from '../contracts/tasksDraftContractABI.json';
import { TasksService } from '../tasks/tasks.service';

import { PrismaService } from '../database/prisma.service';
import { Request, response } from 'express';
import axios from 'axios';
import { UsersService } from 'src/users/users.service';

//This is the service to handle the contracts related to the creation of task drafts / departaments, voting and dao:
// TaskDrafts.sol
// TokenListGovernance.sol
// IDAO.sol

@Injectable()
export class EventsGovernanceHandlerService {
  //setting variables:
  web3UrlProvider = process.env.WEB3_URL_PROVIDER;
  web3Provider = new ethers.providers.JsonRpcProvider(this.web3UrlProvider);
  viewPrivateKey = process.env.VIEW_PRIVATE_KEY;
  taskContractAddress = process.env.TASK_CONTRACT_ADDRESS;
  ipfsBaseURL = process.env.IPFS_BASE_URL;
  walletEther = new ethers.Wallet(this.viewPrivateKey);
  connectedWallet = this.walletEther.connect(this.web3Provider);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService,
  ) {
    this.setupListeners();
  }

  async setupListeners() {
    const departaments = await this.prisma.departament.findMany();
    const contractAddresses = departaments.map(
      (departament) => departament.addressTaskDrafts,
    );

    contractAddresses.forEach((address) => {
      const contract = new ethers.Contract(
        address,
        taskContractABI,
        this.web3Provider,
      );
      
      contract.on('ApplicationCreated', async (taskId, applicationId, metadata, reward, proposer, applicant, event) => {
        // Código para lidar com o evento
      });
    });
  }
}
