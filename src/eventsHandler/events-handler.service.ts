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
import { TasksService } from '../tasks/tasks.service';

import { PrismaService } from '../database/prisma.service';
import { Request, response } from 'express';
import axios from 'axios';

@Injectable()
export class EventsHandlerService {
  //setting variables:
  web3UrlProvider = process.env.WEB3_URL_PROVIDER;
  web3Provider = new ethers.providers.JsonRpcProvider(this.web3UrlProvider);
  viewPrivateKey = process.env.VIEW_PRIVATE_KEY;
  taskContractAddress = process.env.TASK_CONTRACT_ADDRESS;
  ipfsBaseURL = process.env.IPFS_BASE_URL;
  walletEther = new ethers.Wallet(this.viewPrivateKey);
  connectedWallet = this.walletEther.connect(this.web3Provider);
  newcontract = new ethers.Contract(
    this.taskContractAddress,
    taskContractABI,
    this.web3Provider,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {
    this.newcontract.on(
      'TaskCreated',
      async (taskId, proposer, metadata, deadline, budget, event) => {
        const finalData = {
          taskId: String(taskId),
          proposer: proposer,
          metadata: metadata,
          deadline: String(deadline),
          budget: budget,
          blockNumber: String(event.blockNumber),
          blockHash: String(event.blockHash),
          timestamp: String(Date.now()),
          event: event.event,
          transactionHash: event.transactionHash,
          contractAddress: event.address,
        };
        console.log(finalData);
        await this.prisma.event.create({
          data: {
            name: 'TaskCreated',
            data: String(finalData),
          },
        });
        this.tasksService.updateTasksData();
      },
    );
  }
}
