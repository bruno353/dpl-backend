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

import { PrismaService } from '../database/prisma.service';
import { Request, response } from 'express';
import axios from 'axios';
import { GetTasksDto } from './dto/tasks.dto';
import { UploadIPFSMetadataDTO } from './dto/metadata.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  //setting variables:
  web3UrlProvider = process.env.WEB3_URL_PROVIDER;
  web3Provider = new ethers.providers.JsonRpcProvider(this.web3UrlProvider);
  viewPrivateKey = process.env.VIEW_PRIVATE_KEY;
  taskContractAddress = process.env.TASK_CONTRACT_ADDRESS;
  ipfsBaseURL = process.env.IPFS_BASE_URL;

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

    const tasks = [];
    //looping through all the tasks and getting the right data:
    for (let i = 0; i < taskCount; i++) {
      let taskMetadata;
      await contractSigner.getTask(i).then(function (response) {
        taskMetadata = response;
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
        tasks[i][6],
      );
      console.log(ipfsRes);
      if (ipfsRes) {
        tasksWithMetadata.push(ipfsRes);
      }
    }

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
          skills: task['skills'],
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
          skills: task['skills'],
          skillsSearch,
          status: String(task['status']),
          title: task['title'],
          departament: task['departament'],
          type: task['type'],
        },
      });
    }
    return tasksWithMetadata;
  }

  async uploadIPFSMetadata(data: UploadIPFSMetadataDTO) {
    const pinataAxios = axios.create({
      baseURL: 'https://api.pinata.cloud/pinning/',
      headers: {
        pinata_api_key: '7b27a531082e163ee9ae',
        pinata_secret_api_key:
          '0397c0df5cc360ed98cf81f8435569775b0763aa004c00f470146911138475db',
        'Content-Type': 'application/json',
      },
    });

    const response = await pinataAxios.post('pinJSONToIPFS', data);

    const ipfsHash = response.data.IpfsHash;

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

    let taskCount = 0;
    await contractSigner.taskCount().then(function (response) {
      taskCount = response;
    });

    const tasks = [];

    let taskMetadata;
    await contractSigner.getTask(id).then(function (response) {
      taskMetadata = response;
      tasks.push(taskMetadata);
    });

    const tasksWithMetadata = [];

    //getting the metadata from ipfs:
    for (let i = 0; i < taskCount; i++) {
      const ipfsRes = await this.getDataFromIPFS(
        tasks[i][0],
        i,
        tasks[i][1],
        tasks[i][6],
      );
      console.log(ipfsRes);
      if (ipfsRes) {
        tasksWithMetadata.push(ipfsRes);
      }
    }

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
          skills: task['skills'],
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
          skills: task['skills'],
          skillsSearch,
          status: String(task['status']),
          title: task['title'],
          departament: task['departament'],
          type: task['type'],
        },
      });
    }
    return tasksWithMetadata;
  }

  async getTasks(data: GetTasksDto) {
    const {
      departament,
      status,
      deadlineSorting,
      searchBar,
      page = 1,
      limit = 10,
    } = data;

    const skip = (page - 1) * limit;

    let orderBy = {};
    if (deadlineSorting) {
      orderBy = {
        deadline: deadlineSorting === 'newest' ? 'desc' : 'asc',
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
      orderBy: {
        deadline: deadlineSorting === 'oldest' ? 'desc' : 'asc',
      },
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

    const statusOptions = ['open', 'active', 'completed'];
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
        status: statusOptions[status],
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

  // FUNCTIONS
  async getDataFromIPFS(
    hash: string,
    taskId: number,
    deadline: number,
    state: number,
  ) {
    const url = `${this.ipfsBaseURL}/${hash}`;

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
}
