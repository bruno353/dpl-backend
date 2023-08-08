import {
  ConflictException,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

// import { import_ } from '@brillout/import';
import { ethers } from 'ethers';
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

    contractAddresses.forEach((address, i) => {
      const contract = new ethers.Contract(
        address,
        tasksDraftContractABI,
        this.web3Provider,
      );

      // event TaskDraftCreated(        uint256 proposalId,        bytes metadata,        uint64 startDate,        uint64 endDate,        CreateTaskInfo taskInfo    );
      contract.on(
        'TaskDraftCreated',
        async (proposalId, metadata, startDate, endDate, taskInfo, event) => {
          console.log('new event');
          console.log(event);
          console.log('event event');
          console.log(event.event);
          //waiting 4.5 seconds so its gives time to the metadata to load on ipfs.
          await new Promise((resolve) => setTimeout(resolve, 4500));
          const block = await this.web3Provider.getBlock(event['blockNumber']);
          const timestamp =
            String(block.timestamp) || String(Date.now() / 1000); // Timestamp in seconds

          // Fetch the transaction using the transaction hash from the event
          const transaction = await this.web3Provider.getTransaction(
            event.transactionHash,
          );

          // The address that submitted the transaction
          const senderAddress = transaction.from;

          //storing on the "events" table
          const finalData = {
            event: event,
            contractAddress: event.address,
          };
          console.log(finalData);
          try {
            await this.prisma.event.create({
              data: {
                name: 'TaskDraftCreated',
                data: JSON.stringify(finalData),
                eventIndex: String(event.logIndex),
                transactionHash: event.transactionHash,
                blockNumber: String(event.blockNumber),
                taskId: String(proposalId),
                address: senderAddress,
                timestamp: timestamp,
              },
            });
          } catch (err) {
            console.log('error saving event');
          }
          const departament = await this.prisma.departament.findFirst({
            where: {
              addressTaskDrafts: event.address,
            },
          });
          console.log('the departament');
          console.log(departament);
          console.log('receveid from taskInfo');
          console.log(taskInfo);
          await this.tasksService.updateSingleTaskDraftData(
            String(proposalId),
            metadata,
            String(startDate),
            String(endDate),
            taskInfo,
            senderAddress,
            departament.name,
          );
        },
      );
    });
  }
}
