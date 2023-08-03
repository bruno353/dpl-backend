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

import { PrismaService } from '../database/prisma.service';
import { Request, response } from 'express';
import axios from 'axios';
import { GetTaskDto, GetTasksDto } from './dto/tasks.dto';
import { UtilsService } from '../utils/utils.service';
import {
  UploadIPFSMetadataTaskApplicationDTO,
  UploadIPFSMetadataTaskCreationDTO,
  UploadIPFSMetadataTaskSubmissionDTO,
} from './dto/metadata.dto';

@Injectable()
export class TasksService {
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

  //Runs a check-update through the on-chain and off-chain tasks data and store it in the database - its used to always be updated with the tasks data:
  async updateTasksData() {
    const walletEther = new ethers.Wallet(this.viewPrivateKey);
    const connectedWallet = walletEther.connect(this.web3Provider);
    const newcontract = new ethers.Contract(
      this.taskContractAddress,
      taskContractABI,
      this.web3Provider,
    );

    const contractSigner = await newcontract.connect(connectedWallet);

    let taskCount = 0;
    await contractSigner.taskCount().then(function (response) {
      taskCount = response;
    });

    console.log('looping the tasks');
    const tasks = [];
    //looping through all the tasks and getting the right data:
    for (let i = 0; i < taskCount; i++) {
      let taskMetadata;
      await contractSigner.getTask(i).then(function (response) {
        taskMetadata = response; //-> response example: [  'QmX8MeaSR16FEmk6YxRfFJjgSNf5B7DJHDRvLhCcqNhSSv',  BigNumber { _hex: '0x64b9ca80', _isBigNumber: true },  BigNumber { _hex: '0x64b16a58', _isBigNumber: true },  BigNumber { _hex: '0x00', _isBigNumber: true },  0,  '0x08ADb3400E48cACb7d5a5CB386877B3A159d525C',  0,  '0x12be7EDC6829697B880EE949493fe81D15ADdB7c',  [    [      '0x6eFbB027a552637492D827524242252733F06916',      [BigNumber],      tokenContract: '0x6eFbB027a552637492D827524242252733F06916',       amount: [BigNumber]    ]  ],  [],  [],  [],  [],  [],  metadata: 'QmX8MeaSR16FEmk6YxRfFJjgSNf5B7DJHDRvLhCcqNhSSv',        deadline: BigNumber { _hex: '0x64b9ca80', _isBigNumber: true },    creationTimestamp: BigNumber { _hex: '0x64b16a58', _isBigNumber:   ],  applications: [],  submissions: [],  changeScopeRequests: [],  dropExecutorRequests: [],  cancelTaskRequests: []]
        console.log('the task received');
        console.log(response);
        tasks.push(taskMetadata);
      });
    }

    const tasksWithMetadata = [];

    //getting the metadata from ipfs:
    for (let i = 0; i < taskCount; i++) {
      const ipfsRes = await this.getDataFromIPFS(
        tasks[i][0],
        i,
        tasks[i][1],
        tasks[i][5],
      );
      console.log('ipfs respondido');
      console.log(ipfsRes);
      if (ipfsRes) {
        //adding the applications, since its a data from the smart-contracts and not from the ipfs metadata:
        ipfsRes['applications'] = JSON.stringify(tasks[i][8]);
        tasksWithMetadata.push(ipfsRes);
      }
    }
    console.log('liks receveing');
    for (const task of tasksWithMetadata) {
      let finalLinkAsStrings = [];
      if (task['links'] && task['links'].length > 0) {
        finalLinkAsStrings = task['links'].map((dataItem) =>
          JSON.stringify(dataItem),
        );
      }

      const existingTask = await this.prisma.task.findUnique({
        where: { taskId: String(task['id']) },
        include: { payments: true },
      });

      if (existingTask) {
        await this.prisma.payment.deleteMany({
          where: { taskId: existingTask.id },
        });
      }

      const skillsSearch = task['skills'].join(' '); //parameter mandatory to execute case insensitive searchs on the database

      await this.prisma.task.upsert({
        where: { taskId: String(task['id']) },
        update: {
          deadline: task['deadline'],
          description: task['description'],
          file: task['file'],
          links: finalLinkAsStrings,
          payments: {
            create: task['payments'],
          },
          estimatedBudget: task['estimatedBudget'],
          contributorsNeeded: task['numberOfApplicants'],
          projectLength: task['projectLength'],
          skills: task['skills'],
          skillsSearch,
          applications: task['applications'],
          status: String(task['status']),
          title: task['title'],
          departament: task['departament'],
          type: task['type'],
        },
        create: {
          taskId: String(task['id']),
          deadline: task['deadline'],
          description: task['description'],
          file: task['file'],
          links: finalLinkAsStrings,
          applications: task['applications'],
          payments: {
            create: task['payments'],
          },
          estimatedBudget: task['estimatedBudget'],
          contributorsNeeded: task['numberOfApplicants'],
          projectLength: task['projectLength'],
          skills: task['skills'],
          skillsSearch,
          status: String(task['status']),
          title: task['title'],
          departament: task['departament'],
          type: task['type'],
        },
      });
      await this.applicationsFromTask(task['id']);
    }
    return tasksWithMetadata;
  }

  async uploadIPFSMetadataTaskCreation(
    data: UploadIPFSMetadataTaskCreationDTO,
  ) {
    if (data.numberOfApplicants === '1') {
      data['type'] = 'Individual';
    } else {
      data['type'] = 'Group';
    }

    const config = {
      method: 'post',
      url: `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
      headers: {
        pinata_api_key: this.pinataApiKey,
        pinata_secret_api_key: this.pinataSecretApiKey,
        'Content-Type': 'application/json',
      },
      data,
    };

    let dado;

    try {
      await axios(config).then(function (response) {
        dado = response.data;
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException('Error during IPFS upload', {
        cause: new Error(),
        description: 'Error during IPFS upload',
      });
    }

    const ipfsHash = dado.IpfsHash;

    console.log('JSON uploaded to IPFS with hash', ipfsHash);

    return ipfsHash;
  }

  async uploadIPFSMetadataTaskApplication(
    data: UploadIPFSMetadataTaskApplicationDTO,
  ) {
    const config = {
      method: 'post',
      url: `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
      headers: {
        pinata_api_key: this.pinataApiKey,
        pinata_secret_api_key: this.pinataSecretApiKey,
        'Content-Type': 'application/json',
      },
      data,
    };

    let dado;

    try {
      await axios(config).then(function (response) {
        dado = response.data;
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException('Error during IPFS upload', {
        cause: new Error(),
        description: 'Error during IPFS upload',
      });
    }

    const ipfsHash = dado.IpfsHash;

    console.log('JSON uploaded to IPFS with hash', ipfsHash);

    return ipfsHash;
  }

  async uploadIPFSMetadataTaskSubmission(
    data: UploadIPFSMetadataTaskSubmissionDTO,
  ) {
    const config = {
      method: 'post',
      url: `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
      headers: {
        pinata_api_key: this.pinataApiKey,
        pinata_secret_api_key: this.pinataSecretApiKey,
        'Content-Type': 'application/json',
      },
      data,
    };

    let dado;

    try {
      await axios(config).then(function (response) {
        dado = response.data;
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException('Error during IPFS upload', {
        cause: new Error(),
        description: 'Error during IPFS upload',
      });
    }

    const ipfsHash = dado.IpfsHash;

    console.log('JSON uploaded to IPFS with hash', ipfsHash);

    return ipfsHash;
  }

  //updates a single task
  async updateSingleTaskData(id: number) {
    const walletEther = new ethers.Wallet(this.viewPrivateKey);
    const connectedWallet = walletEther.connect(this.web3Provider);
    const newcontract = new ethers.Contract(
      this.taskContractAddress,
      taskContractABI,
      this.web3Provider,
    );

    const contractSigner = await newcontract.connect(connectedWallet);

    const tasks = [];

    let taskMetadata;
    await contractSigner.getTask(id).then(function (response) {
      taskMetadata = response; //-> response example: [  'QmX8MeaSR16FEmk6YxRfFJjgSNf5B7DJHDRvLhCcqNhSSv',  BigNumber { _hex: '0x64b9ca80', _isBigNumber: true },  BigNumber { _hex: '0x64b16a58', _isBigNumber: true },  BigNumber { _hex: '0x00', _isBigNumber: true },  0,  '0x08ADb3400E48cACb7d5a5CB386877B3A159d525C',  0,  '0x12be7EDC6829697B880EE949493fe81D15ADdB7c',  [    [      '0x6eFbB027a552637492D827524242252733F06916',      [BigNumber],      tokenContract: '0x6eFbB027a552637492D827524242252733F06916',       amount: [BigNumber]    ]  ],  [],  [],  [],  [],  [],  metadata: 'QmX8MeaSR16FEmk6YxRfFJjgSNf5B7DJHDRvLhCcqNhSSv',        deadline: BigNumber { _hex: '0x64b9ca80', _isBigNumber: true },    creationTimestamp: BigNumber { _hex: '0x64b16a58', _isBigNumber:   ],  applications: [],  submissions: [],  changeScopeRequests: [],  dropExecutorRequests: [],  cancelTaskRequests: []]
      tasks.push(taskMetadata);
    });

    console.log('the response');
    console.log(taskMetadata);

    const tasksWithMetadata = [];

    const ipfsRes = await this.getDataFromIPFS(
      tasks[0][0],
      id,
      tasks[0][1],
      tasks[0][5],
    );
    console.log('ipfs respondido');
    console.log(ipfsRes);
    if (ipfsRes) {
      //adding the applications, since its a data from the smart-contracts and not from the ipfs metadata:
      console.log('the task2');
      console.log(tasks);
      ipfsRes['applications'] = JSON.stringify(tasks[0][8]);
      console.log('pushing data');
      tasksWithMetadata.push(ipfsRes);
      console.log('pushed');
    }
    console.log('receiving links');
    for (const task of tasksWithMetadata) {
      let finalLinkAsStrings = [];
      if (task['links'] && task['links'].length > 0) {
        finalLinkAsStrings = task['links'].map((dataItem) =>
          JSON.stringify(dataItem),
        );
      }

      const existingTask = await this.prisma.task.findUnique({
        where: { taskId: String(task['id']) },
        include: { payments: true },
      });

      if (existingTask) {
        await this.prisma.payment.deleteMany({
          where: { taskId: existingTask.id },
        });
      }

      const skillsSearch = task['skills'].join(' '); //parameter mandatory to execute case insensitive searchs on the database

      await this.prisma.task.upsert({
        where: { taskId: String(task['id']) },
        update: {
          deadline: task['deadline'],
          description: task['description'],
          file: task['file'],
          links: finalLinkAsStrings,
          payments: {
            create: task['payments'],
          },
          estimatedBudget: task['estimatedBudget'],
          contributorsNeeded: task['numberOfApplicants'],
          projectLength: task['projectLength'],
          skills: task['skills'],
          applications: task['applications'],
          skillsSearch,
          status: String(task['status']),
          title: task['title'],
          departament: task['departament'],
          type: task['type'],
        },
        create: {
          taskId: String(task['id']),
          deadline: task['deadline'],
          description: task['description'],
          file: task['file'],
          links: finalLinkAsStrings,
          payments: {
            create: task['payments'],
          },
          estimatedBudget: task['estimatedBudget'],
          contributorsNeeded: task['numberOfApplicants'],
          projectLength: task['projectLength'],
          skills: task['skills'],
          applications: task['applications'],
          skillsSearch,
          status: String(task['status']),
          title: task['title'],
          departament: task['departament'],
          type: task['type'],
        },
      });

      await this.applicationsFromTask(task['id']);
    }
    return tasksWithMetadata;
  }

  async getTasks(data: GetTasksDto) {
    const {
      departament,
      status,
      deadlineSorting,
      estimatedBudgetSorting,
      searchBar,
      page = 1,
      limit = 10,
    } = data;

    const skip = (page - 1) * limit;

    let orderBy = {};
    if (deadlineSorting && !estimatedBudgetSorting) {
      orderBy = {
        deadline: deadlineSorting === 'newest' ? 'desc' : 'asc',
      };
    }

    if (estimatedBudgetSorting) {
      orderBy = {
        estimatedBudget: estimatedBudgetSorting === 'greater' ? 'desc' : 'asc',
        ...orderBy, // Caso deadlineSorting também esteja definido, será de menor prioridade
      };
    }

    const where = {};

    if (departament) {
      where['departament'] = departament;
    }

    if (status) {
      where['status'] = status;
    }

    if (searchBar) {
      where['OR'] = [
        {
          title: {
            contains: searchBar,
            mode: 'insensitive',
          },
        },
        {
          skillsSearch: {
            contains: searchBar,
            mode: 'insensitive',
          },
        },
      ];
    }

    const tasks = await this.prisma.task.findMany({
      select: {
        taskId: true,
        status: true,
        title: true,
        description: true,
        deadline: true,
        departament: true,
        skills: true,
        estimatedBudget: true,
        projectLength: true,
        contributorsNeeded: true,
        type: true,
        payments: {
          select: {
            tokenContract: true,
            amount: true,
            decimals: true,
          },
        },
      },
      where,
      orderBy,
      skip,
      take: limit,
    });

    // Function to obtain the counting of tasks
    const getTaskCountForStatus = async (status: string) => {
      return await this.prisma.task.count({
        where: {
          ...where,
          status: status,
        },
      });
    };
    const openTaskCount = await getTaskCountForStatus('0');
    const activeTaskCount = await getTaskCountForStatus('1');
    const completedTaskCount = await getTaskCountForStatus('2');

    const totalTasks = await this.prisma.task.count({
      where,
    });

    const totalPages = Math.ceil(totalTasks / limit);

    const finalTasks = tasks.map((task) => {
      const { taskId, status, deadline, ...rest } = task;

      //here do the "days left" flow:
      let daysLeft;
      const now = Date.now();
      const deadlineDay = Number(task.deadline) * 1000;
      const distance = deadlineDay - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));

      if (days < 0) {
        daysLeft = 'ended';
      } else {
        if (days <= 1) {
          daysLeft = `${days} day left`;
        } else {
          daysLeft = `${days} days left`;
        }
      }

      return {
        id: Number(taskId),
        status: this.statusOptions[status],
        deadline,
        daysLeft,
        ...rest,
      };
    });

    return {
      tasks: finalTasks,
      counting: {
        open: openTaskCount,
        active: activeTaskCount,
        completed: completedTaskCount,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalTasks,
        limit,
      },
    };
  }

  async getTask(data: GetTaskDto) {
    const task = await this.prisma.task.findUnique({
      select: {
        taskId: true,
        status: true,
        title: true,
        description: true,
        deadline: true,
        departament: true,
        contributorsNeeded: true,
        executor: true,
        projectLength: true,
        links: true,
        skills: true,
        estimatedBudget: true,
        contributors: true,
        type: true,
        payments: {
          select: {
            tokenContract: true,
            amount: true,
            decimals: true,
          },
        },
        Application: true,
      },
      where: {
        taskId: data.id,
      },
    });

    if (task && task.links && Array.isArray(task.links)) {
      task.links = task.links.map((link) => JSON.parse(link));
    }

    if (task && task.contributors && Array.isArray(task.contributors)) {
      task.contributors = task.contributors.map((contributor) =>
        JSON.parse(contributor),
      );
    }

    if (!task) {
      throw new BadRequestException('Task not found', {
        cause: new Error(),
        description: 'Task not found',
      });
    }

    const { taskId, status, deadline, ...rest } = task;

    //here do the "days left" flow:
    let daysLeft;
    const now = Date.now();
    const deadlineDay = Number(task.deadline) * 1000;
    const distance = deadlineDay - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));

    if (days < 0) {
      daysLeft = 'ended';
    } else {
      if (days <= 1) {
        daysLeft = `${days} day left`;
      } else {
        daysLeft = `${days} days left`;
      }
    }

    //getting events to know how many updates there are
    const updatesCount = await this.prisma.event.findMany({
      where: {
        taskId: data.id,
      },
    });

    return {
      id: Number(taskId),
      status: this.statusOptions[status],
      updatesCount: updatesCount.length,
      deadline,
      daysLeft,
      ...rest,
    };
  }

  async getTaskEvents(data: GetTaskDto) {
    const events = await this.prisma.event.findMany({
      where: {
        taskId: data.id,
      },
    });
    return events;
  }

  // FUNCTIONS
  //get the task metadata
  //example metadata: QmX8MeaSR16FEmk6YxRfFJjgSNf5B7DJHDRvLhCcqNhSSv
  async getDataFromIPFS(
    hash: string,
    taskId: number,
    deadline: number,
    state: number,
  ) {
    console.log('a task');
    console.log(taskId);
    const url = `${this.ipfsBaseURL}/${hash}`;
    console.log('a url');
    console.log(url);

    let res;
    await axios
      .get(url)
      .then(async (response) => {
        console.log('the metadata:');
        console.log(response.data);
        const payments = await this.getDecimalsFromPaymentsToken(
          response.data.payments,
        );
        response.data.payments = payments;
        response.data['estimatedBudget'] = await this.getEstimateBudgetToken(
          payments,
        );
        response.data.id = String(taskId);
        response.data.deadline = String(deadline);
        response.data.status = String(state);
        console.log(`the metadata data`);
        console.log(response.data);
        res = response.data;
      })
      .catch(async (err) => {
        console.log('erro ocorreu');
        console.log(err);
        return null;
      });
    return res;
  }

  //get the application metadata
  async getApplicationDataFromIPFS(hash: string) {
    const url = `${this.ipfsBaseURL}/${hash}`;
    console.log(url);
    let res;
    await axios
      .get(url)
      .then(async (response) => {
        console.log('the metadata:');
        console.log(response.data);
        res = response.data;
      })
      .catch(async (err) => {
        console.log('erro happened');
        console.log('new error');
      });
    return res;
  }

  //get the submission metadata
  async getSubmissionDataFromIPFS(hash: string) {
    const url = `${this.ipfsBaseURL}/${hash}`;
    console.log(url);
    let res;
    await axios
      .get(url)
      .then(async (response) => {
        console.log('the metadata submission:');
        console.log(response.data);
        res = response.data;
      })
      .catch(async (err) => {
        console.log('erro happened on submission');
        console.log('new error');
      });
    return res;
  }

  //example of payment:   "payments": [    {      "tokenContract": "0x6eFbB027a552637492D827524242252733F06916",      "amount": "1000000000000000000",  "decimals": "18"    }  ],
  async getEstimateBudgetToken(payments) {
    let budget = '0';

    if (this.environment === 'PROD') {
      try {
        for (let i = 0; i < payments.length; i++) {
          //if its a weth token, get the price, else it is a stable coin 1:1 so the valueToken should be 1;
          let valueToken = '1';
          if (payments[i].tokenContract === this.wEthTokenAddress) {
            valueToken = await this.utilsService.getWETHPriceTokens(
              this.wEthTokenAddress,
            );
          }

          const totalTokens = new Decimal(payments[i].amount).div(
            new Decimal(new Decimal(10).pow(new Decimal(payments[i].decimals))),
          );
          budget = new Decimal(budget)
            .plus(new Decimal(totalTokens).mul(new Decimal(valueToken)))
            .toFixed(2);
        }
      } catch (err) {
        console.log('error catching estimated budget value');
        console.log(err);
      }
    } else {
      try {
        console.log('doing estimated budget here');
        //if its a dev environment, just consider every token to be a stablecoin 1:1
        for (let i = 0; i < payments.length; i++) {
          const totalTokens = new Decimal(payments[i].amount).div(
            new Decimal(new Decimal(10).pow(new Decimal(payments[i].decimals))),
          );
          console.log('total tokens');
          console.log(totalTokens);
          budget = new Decimal(budget)
            .plus(new Decimal(totalTokens))
            .toFixed(2);
        }
      } catch (err) {
        console.log('error catching estimated budget value');
        console.log(err);
      }
    }
    console.log('budget to return');
    console.log('budget');
    return budget;
  }

  async getDecimalsFromPaymentsToken(payments) {
    console.log('getting decimals');
    console.log(payments);
    const newPayments = [...payments]; // creating a copy of the payments

    const walletEther = new ethers.Wallet(this.viewPrivateKey);
    const connectedWallet = walletEther.connect(this.web3Provider);

    for (let i = 0; i < payments.length; i++) {
      const newcontract = new ethers.Contract(
        payments[i].tokenContract,
        erc20ContractABI,
        this.web3Provider,
      );
      const contractSigner = await newcontract.connect(connectedWallet);

      let decimals = null;
      await contractSigner.decimals().then(function (response) {
        decimals = response;
      });
      console.log('the decimal from token:');
      console.log(decimals);
      if (decimals) {
        newPayments[i].decimals = String(Number(decimals)); // modifying the copy
      }
    }
    // returning the state with the correctly decimals
    return newPayments;
  }

  //Query the events log to get all the applications from a task and store it on database
  async applicationsFromTask(id: number) {
    console.log(id);
    const newcontract = new ethers.Contract(
      this.taskContractAddress,
      taskContractABI,
      this.web3Provider,
    );

    const filter = await newcontract.filters.ApplicationCreated();

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
    const events = logs.map((log) => {
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

    const filteredEvents = events.filter((event) => event.args.taskId.eq(id)); //[  {    name: 'ApplicationCreated',    args: [      [BigNumber],      0,      'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      [Array],      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      taskId: [BigNumber],      applicationId: 0,      metadata: 'QmZQvs4qfK9iYxfAZxb6XwTz6vexkvLjmJy4iKZURUB5Rt',      reward: [Array],      proposer: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170',      applicant: '0x0DD7167d9707faFE0837c0b1fe12348AfAabF170'    ],    signature: 'ApplicationCreated(uint256,uint16,string,(bool,address,uint88)[],address,address)',    topic: '0x7dea79221549b396f31442a220505470acfcfd38f772b6b3faa676d25df5998d',    blockNumber: 38426300,    timestamp: 1690664419  }]

    // Define a cache for timestamps
    const timestampCache = {};

    const finalEvents = [];
    console.log('getting events');
    // Get block data for each event
    for (const event of filteredEvents) {
      const applicationExists = await this.prisma.application.findFirst({
        where: {
          taskId: String(id),
          applicationId: String(event['args'][1]),
        },
      });
      if (!applicationExists) {
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

        console.log('creating args');
        if (event['args'][3] && Array.isArray(event['args'][3])) {
          event['reward'] = event['args'][3].map((reward) =>
            JSON.stringify(reward),
          );
        }

        console.log('getting metadata if its exists');
        let metadataData;
        try {
          if (String(event['args'][2]).length > 0) {
            metadataData = await this.getApplicationDataFromIPFS(
              String(event['args'][2]),
            );
          }
        } catch (err) {
          console.log('not found metadata valid');
        }
        finalEvents.push({
          taskId: String(id),
          applicationId: String(event['args'][1]),
          metadata: String(event['args'][2]),
          reward: event['reward'] || [],
          proposer: event['args'][4],
          applicant: event['args'][5],
          metadataDescription: metadataData['description'] || '',
          metadataProposedBudget:
            String(metadataData['budgetPercentageRequested']) || '',
          metadataAdditionalLink: metadataData['additionalLink'] || '',
          metadataDisplayName: metadataData['displayName'] || '',
          timestamp: event['timestamp'],
          transactionHash: event['transactionHash'],
          blockNumber: String(event['blockNumber']),
        });
      }
    }

    console.log('creating application events');
    console.log(finalEvents);
    await this.prisma.application.createMany({
      data: finalEvents,
    });

    console.log(filteredEvents);
  }
}
