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

import * as tasksDraftContractABI from '../contracts/tasksDraftContractABI.json';
import * as nftContractABI from '../contracts/nftContractABI.json';
import * as tokenListGovernanceABI from '../contracts/tokenListGovernanceABI.json';

import { PrismaService } from '../database/prisma.service';
import { Request, response } from 'express';
import axios from 'axios';
import {
  GetSubmissionDto,
  GetTaskDto,
  GetTasksDto,
  GetTokensNecessaryToFillRequestDTO,
  GetUserToDraftTaskDto,
} from './dto/tasks.dto';
import { UtilsService } from '../utils/utils.service';
import {
  UploadIPFSMetadataTaskApplicationDTO,
  UploadIPFSMetadataTaskCreationDTO,
  UploadIPFSMetadataTaskDraftCreationDTO,
  UploadIPFSMetadataTaskSubmissionDTO,
  UploadIPFSMetadataTaskSubmissionRevisionDTO,
} from './dto/metadata.dto';
import { TasksService } from '../tasks/tasks.service';
import { UsersService } from 'src/users/users.service';

//This service is utilized to update all the governance workflow - it runs a query trhough all the events from the contracts governance to update it (its util to some cases in which the backend may have losed some events caused by a downtime or something similar)
@Injectable()
export class UpdatesGovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService,
  ) {}

  //setting variables:
  web3UrlProvider = process.env.WEB3_URL_PROVIDER;
  web3Provider = new ethers.providers.JsonRpcProvider(this.web3UrlProvider);
  viewPrivateKey = process.env.VIEW_PRIVATE_KEY;
  taskContractAddress = process.env.TASK_CONTRACT_ADDRESS;
  ipfsBaseURL = process.env.IPFS_BASE_URL;
  recallIpfsBaseURL = process.env.RECALL_IPFS_BASE_URL;
  pinataApiKey = process.env.PINATA_API_KEY;
  pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
  environment = process.env.ENVIRONMENT;
  usdcTokenAddress = process.env.USDC_TOKEN_ADDRESS;
  usdtTokenAddress = process.env.USDT_TOKEN_ADDRESS;
  wEthTokenAddress = process.env.WETH_TOKEN_ADDRESS;
  nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;

  //initiate the workflow to update all the governance workflow
  async updateGovernanceData() {
    //Draft listeners
    console.log('now updating the task drafts - events');
    await this.updateTaskDraftsFromGovernance();
  }

  async updateTaskDraftsFromGovernance() {
    console.log('querying all the contracts - departaments');
    const departaments = await this.prisma.departament.findMany();
    const contractAddresses = departaments.map(
      (departament) => departament.addressTaskDrafts,
    );

    console.log('addresses: ' + contractAddresses);

    contractAddresses.forEach(async (address, i) => {
      const newcontract = new ethers.Contract(
        address,
        tasksDraftContractABI,
        this.web3Provider,
      );

      const filter = newcontract.filters.TaskDraftCreated();

      // Getting the events
      const logs = await this.web3Provider.getLogs({
        fromBlock: 0,
        toBlock: 'latest',
        address: newcontract.address,
        topics: filter.topics,
      });

      console.log('logs');
      console.log(logs);

      // Parsing the events
      const filteredEvents = logs.map((log) => {
        const event = newcontract.interface.parseLog(log);
        console.log('final event');
        console.log(event);
        return {
          name: event.name,
          args: event.args,
          signature: event.signature,
          topic: event.topic,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        };
      });

      // const filteredEvents = events.filter((event) => event.args.taskId.eq(id)); //[  {    name: 'ApplicationCreated',    args: [      [BigNumber],      0,      'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      [Array],      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      taskId: [BigNumber],      applicationId: 0,      metadata: 'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      reward: [Array],      proposer: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      applicant: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170'    ],    signature: 'ApplicationCreated(uint256,uint16,string,(bool,address,uint88)[],address,address)',    topic: '0x7dea79221549b396f31442a220505470acfcfd38f772b6b3faa676d25df5998d',    blockNumber: 38426300,    timestamp: 1690664419  }]

      // Define a cache for timestamps
      const timestampCache = {};

      //getting events
      console.log('getting events');
      // Get block data for each event
      for (const event of filteredEvents) {
        if (timestampCache[event['blockNumber']]) {
          // If the timestamp for this block is already cached, use it
          event['timestamp'] = timestampCache[event['blockNumber']];
        } else {
          // Otherwise, fetch the block and cache the timestamp
          const block = await this.web3Provider.getBlock(event['blockNumber']);
          const timestamp = block.timestamp; // Timestamp in seconds
          timestampCache[event['blockNumber']] = timestamp;
          event['timestamp'] = String(timestamp);
        }

        console.log('getting the event sender');
        console.log(event['transactionHash']);
        const transaction = await this.web3Provider.getTransaction(
          event['transactionHash'],
        );

        // The address that submitted the transaction
        const senderAddress = transaction.from;

        const departament = await this.prisma.departament.findFirst({
          where: {
            addressTaskDrafts: address,
          },
        });

        try {
          await this.updateSingleTaskDraftData(
            String(event['args'][0]),
            event['args'][1],
            String(event['args'][2]),
            String(event['args'][3]),
            event['args'][4],
            senderAddress,
            departament.name,
          );
        } catch (err) {
          console.log('error getting task draft');
        }
      }
    });
    console.log('now updating the vote casts - events');
    await this.updateVoteCastFromGovernance();
  }

  async updateVoteCastFromGovernance() {
    console.log('querying all the contracts - departaments');
    const departaments = await this.prisma.departament.findMany();
    const contractAddresses = departaments.map(
      (departament) => departament.addressTokenListGovernance,
    );

    console.log('addresses: ' + contractAddresses);

    contractAddresses.forEach(async (address, i) => {
      const newcontract = new ethers.Contract(
        address,
        tokenListGovernanceABI,
        this.web3Provider,
      );

      const filter = newcontract.filters.VoteCast();

      // Getting the events
      const logs = await this.web3Provider.getLogs({
        fromBlock: 0,
        toBlock: 'latest',
        address: newcontract.address,
        topics: filter.topics,
      });

      console.log('logs');
      console.log(logs);

      // Parsing the events
      const filteredEvents = logs.map((log) => {
        const event = newcontract.interface.parseLog(log);
        console.log('final event');
        console.log(event);
        return {
          name: event.name,
          args: event.args,
          signature: event.signature,
          topic: event.topic,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        };
      });

      // const filteredEvents = events.filter((event) => event.args.taskId.eq(id)); //[  {    name: 'ApplicationCreated',    args: [      [BigNumber],      0,      'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      [Array],      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      taskId: [BigNumber],      applicationId: 0,      metadata: 'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      reward: [Array],      proposer: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      applicant: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170'    ],    signature: 'ApplicationCreated(uint256,uint16,string,(bool,address,uint88)[],address,address)',    topic: '0x7dea79221549b396f31442a220505470acfcfd38f772b6b3faa676d25df5998d',    blockNumber: 38426300,    timestamp: 1690664419  }]

      // Define a cache for timestamps
      const timestampCache = {};

      //getting events
      console.log('getting events');
      // Get block data for each event
      for (const event of filteredEvents) {
        if (timestampCache[event['blockNumber']]) {
          // If the timestamp for this block is already cached, use it
          event['timestamp'] = timestampCache[event['blockNumber']];
        } else {
          // Otherwise, fetch the block and cache the timestamp
          const block = await this.web3Provider.getBlock(event['blockNumber']);
          const timestamp = block.timestamp; // Timestamp in seconds
          timestampCache[event['blockNumber']] = timestamp;
          event['timestamp'] = String(timestamp);
        }

        console.log('getting the event sender');
        console.log(event['transactionHash']);
        const transaction = await this.web3Provider.getTransaction(
          event['transactionHash'],
        );

        // The address that submitted the transaction
        const senderAddress = transaction.from;

        const departament = await this.prisma.departament.findFirst({
          where: {
            addressTokenListGovernance: address,
          },
        });

        const task = await this.prisma.task.findFirst({
          where: {
            departament: departament.name,
            proposalId: String(event['args'][0]),
          },
        });

        try {
          await this.prisma.draftVote.upsert({
            where: {
              id_task_address: {
                address: senderAddress,
                id_task: task.id,
              },
            },
            update: {
              address: senderAddress,
              voteOption: String(event['args'][2]),
            },
            create: {
              address: senderAddress,
              voteOption: String(event['args'][2]),
              id_task: task.id,
            },
          });
        } catch (err) {
          console.log('error updating vote cast');
        }
      }
    });
    console.log('now updating the proposal executed - events');
    await this.updateProposalExecutedFromGovernance();
  }

  async updateProposalExecutedFromGovernance() {
    console.log('querying all the contracts - departaments');
    const departaments = await this.prisma.departament.findMany();
    const contractAddresses = departaments.map(
      (departament) => departament.addressTokenListGovernance,
    );

    console.log('addresses: ' + contractAddresses);

    contractAddresses.forEach(async (address, i) => {
      const newcontract = new ethers.Contract(
        address,
        tokenListGovernanceABI,
        this.web3Provider,
      );

      const filter = newcontract.filters.ProposalExecuted();

      // Getting the events
      const logs = await this.web3Provider.getLogs({
        fromBlock: 0,
        toBlock: 'latest',
        address: newcontract.address,
        topics: filter.topics,
      });

      console.log('logs');
      console.log(logs);

      // Parsing the events
      const filteredEvents = logs.map((log) => {
        const event = newcontract.interface.parseLog(log);
        console.log('final event');
        console.log(event);
        return {
          name: event.name,
          args: event.args,
          signature: event.signature,
          topic: event.topic,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        };
      });

      // const filteredEvents = events.filter((event) => event.args.taskId.eq(id)); //[  {    name: 'ApplicationCreated',    args: [      [BigNumber],      0,      'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      [Array],      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      taskId: [BigNumber],      applicationId: 0,      metadata: 'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      reward: [Array],      proposer: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      applicant: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170'    ],    signature: 'ApplicationCreated(uint256,uint16,string,(bool,address,uint88)[],address,address)',    topic: '0x7dea79221549b396f31442a220505470acfcfd38f772b6b3faa676d25df5998d',    blockNumber: 38426300,    timestamp: 1690664419  }]

      // Define a cache for timestamps
      const timestampCache = {};

      //getting events
      console.log('getting events');
      // Get block data for each event
      for (const event of filteredEvents) {
        if (timestampCache[event['blockNumber']]) {
          // If the timestamp for this block is already cached, use it
          event['timestamp'] = timestampCache[event['blockNumber']];
        } else {
          // Otherwise, fetch the block and cache the timestamp
          const block = await this.web3Provider.getBlock(event['blockNumber']);
          const timestamp = block.timestamp; // Timestamp in seconds
          timestampCache[event['blockNumber']] = timestamp;
          event['timestamp'] = String(timestamp);
        }

        console.log('getting the event sender');
        console.log(event['transactionHash']);
        const transaction = await this.web3Provider.getTransaction(
          event['transactionHash'],
        );

        // The address that submitted the transaction
        const senderAddress = transaction.from;

        const departament = await this.prisma.departament.findFirst({
          where: {
            addressTokenListGovernance: address,
          },
        });

        try {
          await this.prisma.task.updateMany({
            where: {
              departament: departament.name,
              proposalId: String(event['args'][0]),
            },
            data: {
              isDraftCompleted: true,
            },
          });
          console.log('proposal executed with success');
        } catch (err) {
          console.log('error updating proposal executed');
          console.log('error updating proposal executed');
          console.log('error updating proposal executed');
        }
      }
    });
    console.log('now updating the tokens added - events');
    await this.updateTokensAddedFromGovernance();
  }

  async updateTokensAddedFromGovernance() {
    console.log('querying all the contracts - departaments');
    const departaments = await this.prisma.departament.findMany();
    const contractAddresses = departaments.map(
      (departament) => departament.addressTokenListGovernance,
    );

    console.log('addresses: ' + contractAddresses);

    contractAddresses.forEach(async (address, i) => {
      const newcontract = new ethers.Contract(
        address,
        tokenListGovernanceABI,
        this.web3Provider,
      );

      const filter = newcontract.filters.TokensAdded();

      // Getting the events
      const logs = await this.web3Provider.getLogs({
        fromBlock: 0,
        toBlock: 'latest',
        address: newcontract.address,
        topics: filter.topics,
      });

      console.log('logs');
      console.log(logs);

      // Parsing the events
      const filteredEvents = logs.map((log) => {
        const event = newcontract.interface.parseLog(log);
        console.log('final event');
        console.log(event);
        return {
          name: event.name,
          args: event.args,
          signature: event.signature,
          topic: event.topic,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        };
      });

      // const filteredEvents = events.filter((event) => event.args.taskId.eq(id)); //[  {    name: 'ApplicationCreated',    args: [      [BigNumber],      0,      'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      [Array],      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      taskId: [BigNumber],      applicationId: 0,      metadata: 'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      reward: [Array],      proposer: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      applicant: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170'    ],    signature: 'ApplicationCreated(uint256,uint16,string,(bool,address,uint88)[],address,address)',    topic: '0x7dea79221549b396f31442a220505470acfcfd38f772b6b3faa676d25df5998d',    blockNumber: 38426300,    timestamp: 1690664419  }]

      // Define a cache for timestamps
      const timestampCache = {};

      //getting events
      console.log('getting events');
      // Get block data for each event
      for (const event of filteredEvents) {
        if (timestampCache[event['blockNumber']]) {
          // If the timestamp for this block is already cached, use it
          event['timestamp'] = timestampCache[event['blockNumber']];
        } else {
          // Otherwise, fetch the block and cache the timestamp
          const block = await this.web3Provider.getBlock(event['blockNumber']);
          const timestamp = block.timestamp; // Timestamp in seconds
          timestampCache[event['blockNumber']] = timestamp;
          event['timestamp'] = String(timestamp);
        }

        console.log('getting the event sender');
        console.log(event['transactionHash']);
        const transaction = await this.web3Provider.getTransaction(
          event['transactionHash'],
        );

        // The address that submitted the transaction
        const senderAddress = transaction.from;

        //updating the verifiedcontributorToken with the new departament
        for (let i = 0; i < event['args'][0].length; i++) {
          const contributorToken =
            await this.prisma.verifiedContributorToken.findFirst({
              where: {
                tokenId: String(event['args'][0][i]),
              },
            });

          // Verifique se o endereço já está na lista
          if (
            contributorToken &&
            !contributorToken.departamentList.includes(address)
          ) {
            await this.prisma.verifiedContributorToken.update({
              where: {
                tokenId: String(event['args'][0][i]),
              },
              data: {
                departamentList: {
                  // Adicione o novo endereço à lista existente
                  push: address,
                },
              },
            });
          }
        }
      }
    });
    console.log('now updating the tokens removed - events');
    await this.updateTokensRemovedFromGovernance();
  }

  async updateTokensRemovedFromGovernance() {
    console.log('querying all the contracts - departaments');
    const departaments = await this.prisma.departament.findMany();
    const contractAddresses = departaments.map(
      (departament) => departament.addressTokenListGovernance,
    );

    console.log('addresses: ' + contractAddresses);

    contractAddresses.forEach(async (address, i) => {
      const newcontract = new ethers.Contract(
        address,
        tokenListGovernanceABI,
        this.web3Provider,
      );

      const filter = newcontract.filters.TokensRemoved();

      // Getting the events
      const logs = await this.web3Provider.getLogs({
        fromBlock: 0,
        toBlock: 'latest',
        address: newcontract.address,
        topics: filter.topics,
      });

      console.log('logs');
      console.log(logs);

      // Parsing the events
      const filteredEvents = logs.map((log) => {
        const event = newcontract.interface.parseLog(log);
        console.log('final event');
        console.log(event);
        return {
          name: event.name,
          args: event.args,
          signature: event.signature,
          topic: event.topic,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        };
      });

      // const filteredEvents = events.filter((event) => event.args.taskId.eq(id)); //[  {    name: 'ApplicationCreated',    args: [      [BigNumber],      0,      'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      [Array],      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      taskId: [BigNumber],      applicationId: 0,      metadata: 'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      reward: [Array],      proposer: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      applicant: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170'    ],    signature: 'ApplicationCreated(uint256,uint16,string,(bool,address,uint88)[],address,address)',    topic: '0x7dea79221549b396f31442a220505470acfcfd38f772b6b3faa676d25df5998d',    blockNumber: 38426300,    timestamp: 1690664419  }]

      // Define a cache for timestamps
      const timestampCache = {};

      //getting events
      console.log('getting events');
      // Get block data for each event
      for (const event of filteredEvents) {
        if (timestampCache[event['blockNumber']]) {
          // If the timestamp for this block is already cached, use it
          event['timestamp'] = timestampCache[event['blockNumber']];
        } else {
          // Otherwise, fetch the block and cache the timestamp
          const block = await this.web3Provider.getBlock(event['blockNumber']);
          const timestamp = block.timestamp; // Timestamp in seconds
          timestampCache[event['blockNumber']] = timestamp;
          event['timestamp'] = String(timestamp);
        }

        console.log('getting the event sender');
        console.log(event['transactionHash']);
        const transaction = await this.web3Provider.getTransaction(
          event['transactionHash'],
        );

        // The address that submitted the transaction
        const senderAddress = transaction.from;

        //updating the verifiedcontributorToken with the new departament
        for (let i = 0; i < event['args'][0].length; i++) {
          const contributorToken =
            await this.prisma.verifiedContributorToken.findFirst({
              where: {
                tokenId: String(event['args'][0][i]),
              },
            });

          // Verifique se o endereço já está na lista
          if (
            contributorToken &&
            contributorToken.departamentList.includes(address)
          ) {
            const newDepartamentList = contributorToken.departamentList.filter(
              (addressDepartament) => addressDepartament !== address,
            );
            await this.prisma.verifiedContributorToken.update({
              where: {
                tokenId: String(event['args'][0][i]),
              },
              data: {
                departamentList: newDepartamentList,
              },
            });
          }
        }
      }
    });
    console.log('now updating the nfts transfers - events');
    await this.updateTransferFromTask();
  }

  async updateTransferFromTask() {
    console.log(
      'getting the nft contract that rule the logic of verified contributor tokens',
    );
    const newcontract = new ethers.Contract(
      this.nftContractAddress,
      nftContractABI,
      this.web3Provider,
    );

    const filter = newcontract.filters.Transfer();

    // Getting the events
    const logs = await this.web3Provider.getLogs({
      fromBlock: 0,
      toBlock: 'latest',
      address: newcontract.address,
      topics: filter.topics,
    });

    console.log('logs');
    console.log(logs);

    // Parsing the events
    const filteredEvents = logs.map((log) => {
      const event = newcontract.interface.parseLog(log);
      console.log('final event');
      console.log(event);
      return {
        name: event.name,
        args: event.args,
        signature: event.signature,
        topic: event.topic,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      };
    });

    // Define a cache for timestamps
    const timestampCache = {};

    //getting events
    console.log('getting events');
    // Get block data for each event
    for (const event of filteredEvents) {
      if (timestampCache[event['blockNumber']]) {
        // If the timestamp for this block is already cached, use it
        event['timestamp'] = timestampCache[event['blockNumber']];
      } else {
        // Otherwise, fetch the block and cache the timestamp
        const block = await this.web3Provider.getBlock(event['blockNumber']);
        const timestamp = block.timestamp; // Timestamp in seconds
        timestampCache[event['blockNumber']] = timestamp;
        event['timestamp'] = String(timestamp);
      }

      console.log('first, getting if the user exists in the db');
      await this.usersService.checkIfUserExistsOnTheChain(event['args'][1]);

      //seeing if the token already exists on the db:
      const tokenExists = await this.prisma.verifiedContributorToken.findFirst({
        where: {
          tokenId: String(event['args'][2]),
        },
      });

      const user = await this.prisma.user.findFirst({
        where: {
          address: event['args'][1],
        },
      });
      console.log('the user');
      console.log(user);

      if (!tokenExists) {
        await this.prisma.verifiedContributorToken.create({
          data: {
            tokenId: String(event['args'][2]),
            userId: user.id,
          },
        });
      } else {
        //if the token exists, changing its owner
        await this.prisma.verifiedContributorToken.update({
          where: {
            id: tokenExists.id,
          },
          data: {
            userId: user.id,
          },
        });
      }
    }
  }

  //functions:
  //updates a single task
  async updateSingleTaskDraftData(
    proposalId: string,
    aragonMetadata: string,
    startDate: string,
    endDate: string,
    taskInfo: any,
    executor: string,
    departamentName: string,
  ) {
    const ipfsRes = await this.tasksService.getDataFromIPFS(
      taskInfo['metadata'],
      Number(proposalId),
      taskInfo['deadline'],
      taskInfo['budget'],
      0,
    );
    console.log('ipfs respondido');
    console.log(ipfsRes);

    let finalLinkAsStrings = [];
    if (ipfsRes['links'] && ipfsRes['links'].length > 0) {
      finalLinkAsStrings = ipfsRes['links'].map((dataItem) =>
        JSON.stringify(dataItem),
      );
    }

    const skillsSearch = ipfsRes['skills'].join(' '); //parameter mandatory to execute case insensitive searchs on the database

    const existingTask = await this.prisma.task.findUnique({
      where: {
        proposalId_departament: {
          proposalId: String(ipfsRes['id']),
          departament: departamentName,
        },
      },
      include: { payments: true },
    });
    if (existingTask) {
      console.log('exists tasks');
      await this.prisma.payment.deleteMany({
        where: {
          taskId: existingTask.id,
        },
      });
      console.log('deleted');
    }

    await this.prisma.task.upsert({
      where: {
        proposalId_departament: {
          proposalId: String(ipfsRes['id']),
          departament: departamentName,
        },
      },
      update: {
        deadline: ipfsRes['deadline'],
        description: ipfsRes['description'],
        file: ipfsRes['file'],
        links: finalLinkAsStrings,
        payments: {
          create: ipfsRes['payments'],
        },
        estimatedBudget: ipfsRes['estimatedBudget'],
        contributorsNeeded: ipfsRes['numberOfApplicants'],
        projectLength: ipfsRes['projectLength'],
        skills: ipfsRes['skills'],
        skillsSearch,
        status: '3',
        title: ipfsRes['title'],
        departament: ipfsRes['departament'],
        type: ipfsRes['type'],
        isDraft: true,
        aragonMetadata: aragonMetadata,
        startDate,
        endDate,
        executor,
      },
      create: {
        proposalId: String(ipfsRes['id']),
        deadline: ipfsRes['deadline'],
        description: ipfsRes['description'],
        file: ipfsRes['file'],
        links: finalLinkAsStrings,
        payments: {
          create: ipfsRes['payments'],
        },
        estimatedBudget: ipfsRes['estimatedBudget'],
        contributorsNeeded: ipfsRes['numberOfApplicants'],
        projectLength: ipfsRes['projectLength'],
        skills: ipfsRes['skills'],
        skillsSearch,
        status: '3',
        title: ipfsRes['title'],
        departament: ipfsRes['departament'],
        type: ipfsRes['type'],
        isDraft: true,
        aragonMetadata: aragonMetadata,
        startDate,
        endDate,
        executor,
      },
    });

    return;
  }
}
