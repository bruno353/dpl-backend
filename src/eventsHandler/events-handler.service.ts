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
import { UsersService } from 'src/users/users.service';

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
    private readonly usersService: UsersService,
  ) {
    // //event TaskCreated(uint256 taskId, string metadata, uint64 deadline, ERC20Transfer[] budget, address manager, PreapprovedApplication[] preapproved);
    // this.newcontract.on(
    //   'TaskCreated',
    //   async (taskId, proposer, metadata, deadline, budget, event) => {
    //     const finalData = {
    //       taskId: String(taskId),
    //       proposer: proposer,
    //       metadata: metadata,
    //       deadline: String(deadline),
    //       budget: budget,
    //       blockNumber: String(event.blockNumber),
    //       blockHash: String(event.blockHash),
    //       timestamp: String(Date.now()),
    //       event: event.event,
    //       transactionHash: event.transactionHash,
    //       contractAddress: event.address,
    //     };
    //     console.log(finalData);
    //     await this.prisma.event.create({
    //       data: {
    //         name: 'TaskCreated',
    //         data: JSON.stringify(finalData),
    //       },
    //     });
    //     await this.tasksService.updateSingleTaskData(taskId);
    //     this.tasksService.updateTasksData();
    //   },
    // );
    // //event ApplicationCreated(uint256 taskId, uint16 applicationId, string metadata, Reward[] reward, address proposer, address applicant);
    // this.newcontract.on(
    //   'ApplicationCreated',
    //   async (
    //     taskId,
    //     applicationId,
    //     metadata,
    //     reward,
    //     proposer,
    //     msgSender,
    //     event,
    //   ) => {
    //     const finalData = {
    //       taskId: String(taskId),
    //       applicationId: String(applicationId),
    //       proposer: proposer,
    //       msgSender: msgSender,
    //       metadata: metadata,
    //       reward: JSON.stringify(reward),
    //       blockNumber: String(event.blockNumber),
    //       blockHash: String(event.blockHash),
    //       timestamp: String(Date.now()),
    //       event: event.event,
    //       transactionHash: event.transactionHash,
    //       contractAddress: event.address,
    //     };
    //     console.log(finalData);
    //     await this.prisma.event.create({
    //       data: {
    //         name: 'ApplicationCreated',
    //         data: JSON.stringify(finalData),
    //       },
    //     });
    //     await this.tasksService.updateSingleTaskData(taskId);
    //     this.tasksService.updateTasksData();
    //   },
    // );
    // //event ApplicationAccepted(uint256 taskId, uint16 application, address proposer, address applicant);
    // this.newcontract.on(
    //   'ApplicationAccepted',
    //   async (taskId, applicationId, proposer, applicant, event) => {
    //     const finalData = {
    //       taskId: String(taskId),
    //       applicationId: String(applicationId),
    //       proposer: proposer,
    //       applicant: applicant,
    //       blockNumber: String(event.blockNumber),
    //       blockHash: String(event.blockHash),
    //       timestamp: String(Date.now()),
    //       event: event.event,
    //       transactionHash: event.transactionHash,
    //       contractAddress: event.address,
    //     };
    //     console.log(finalData);
    //     await this.prisma.event.create({
    //       data: {
    //         name: 'ApplicationAccepted',
    //         data: JSON.stringify(finalData),
    //       },
    //     });
    //     await this.tasksService.updateSingleTaskData(taskId);
    //     this.tasksService.updateTasksData();
    //   },
    // );
    // //event SubmissionCreated(uint256 taskId, uint8 submissionId, string metadata, address proposer, address executor);
    // this.newcontract.on(
    //   'SubmissionCreated',
    //   async (taskId, submissionId, metadata, proposer, executor, event) => {
    //     const finalData = {
    //       taskId: String(taskId),
    //       submissionId: String(submissionId),
    //       metadata: metadata,
    //       proposer: proposer,
    //       executor: executor,
    //       blockNumber: String(event.blockNumber),
    //       blockHash: String(event.blockHash),
    //       timestamp: String(Date.now()),
    //       event: event.event,
    //       transactionHash: event.transactionHash,
    //       contractAddress: event.address,
    //     };
    //     console.log(finalData);
    //     await this.prisma.event.create({
    //       data: {
    //         name: 'SubmissionCreated',
    //         data: JSON.stringify(finalData),
    //       },
    //     });
    //     await this.tasksService.updateSingleTaskData(taskId);
    //     this.tasksService.updateTasksData();
    //   },
    // );
    // //event SubmissionReviewed(uint256 taskId, uint8 submissionId, SubmissionJudgement judgement, string feedback, address proposer, address executor);
    // this.newcontract.on(
    //   'SubmissionReviewed',
    //   async (
    //     taskId,
    //     submissionId,
    //     judgement,
    //     feedback,
    //     proposer,
    //     executor,
    //     event,
    //   ) => {
    //     const finalData = {
    //       taskId: String(taskId),
    //       submissionId: String(submissionId),
    //       judgement: JSON.stringify(judgement),
    //       feedback: JSON.stringify(feedback),
    //       proposer: proposer,
    //       executor: executor,
    //       blockNumber: String(event.blockNumber),
    //       blockHash: String(event.blockHash),
    //       timestamp: String(Date.now()),
    //       event: event.event,
    //       transactionHash: event.transactionHash,
    //       contractAddress: event.address,
    //     };
    //     console.log(finalData);
    //     await this.prisma.event.create({
    //       data: {
    //         name: 'SubmissionReviewed',
    //         data: JSON.stringify(finalData),
    //       },
    //     });
    //     await this.tasksService.updateSingleTaskData(taskId);
    //     this.tasksService.updateTasksData();
    //   },
    // );
    // //event TaskCompleted(uint256 taskId, address proposer, address executor);
    // this.newcontract.on(
    //   'TaskCompleted',
    //   async (taskId, proposer, executor, event) => {
    //     const finalData = {
    //       taskId: String(taskId),
    //       proposer: proposer,
    //       executor: executor,
    //       blockNumber: String(event.blockNumber),
    //       blockHash: String(event.blockHash),
    //       timestamp: String(Date.now()),
    //       event: event.event,
    //       transactionHash: event.transactionHash,
    //       contractAddress: event.address,
    //     };
    //     console.log(finalData);
    //     await this.prisma.event.create({
    //       data: {
    //         name: 'TaskCompleted',
    //         data: JSON.stringify(finalData),
    //       },
    //     });
    //     await this.tasksService.updateSingleTaskData(taskId);
    //     this.tasksService.updateTasksData();
    //   },
    // );
    // //event ChangeScopeRequested(uint256 taskId, uint8 requestId, string metadata, uint64 deadline, Reward[] reward);
    // this.newcontract.on(
    //   'ChangeScopeRequested',
    //   async (taskId, proposer, executor, event) => {
    //     const finalData = {
    //       taskId: String(taskId),
    //       proposer: proposer,
    //       executor: executor,
    //       blockNumber: String(event.blockNumber),
    //       blockHash: String(event.blockHash),
    //       timestamp: String(Date.now()),
    //       event: event.event,
    //       transactionHash: event.transactionHash,
    //       contractAddress: event.address,
    //     };
    //     console.log(finalData);
    //     await this.prisma.event.create({
    //       data: {
    //         name: 'ChangeScopeRequested',
    //         data: JSON.stringify(finalData),
    //       },
    //     });
    //     await this.tasksService.updateSingleTaskData(taskId);
    //     this.tasksService.updateTasksData();
    //   },
    // );
    // //event DropExecutorRequested(uint256 taskId, uint8 requestId, string explanation);
    // this.newcontract.on(
    //   'DropExecutorRequested',
    //   async (taskId, requestId, explanation, event) => {
    //     const finalData = {
    //       taskId: String(taskId),
    //       requestId: String(requestId),
    //       explanation: explanation,
    //       blockNumber: String(event.blockNumber),
    //       blockHash: String(event.blockHash),
    //       timestamp: String(Date.now()),
    //       event: event.event,
    //       transactionHash: event.transactionHash,
    //       contractAddress: event.address,
    //     };
    //     console.log(finalData);
    //     await this.prisma.event.create({
    //       data: {
    //         name: 'newcontract',
    //         data: JSON.stringify(finalData),
    //       },
    //     });
    //     await this.tasksService.updateSingleTaskData(taskId);
    //     this.tasksService.updateTasksData();
    //   },
    // );
    // //event CancelTaskRequested(uint256 taskId, uint8 requestId, string explanation);
    // this.newcontract.on(
    //   'CancelTaskRequested',
    //   async (taskId, requestId, explanation, event) => {
    //     const finalData = {
    //       taskId: String(taskId),
    //       requestId: String(requestId),
    //       explanation: explanation,
    //       blockNumber: String(event.blockNumber),
    //       blockHash: String(event.blockHash),
    //       timestamp: String(Date.now()),
    //       event: event.event,
    //       transactionHash: event.transactionHash,
    //       contractAddress: event.address,
    //     };
    //     console.log(finalData);
    //     await this.prisma.event.create({
    //       data: {
    //         name: 'CancelTaskRequested',
    //         data: JSON.stringify(finalData),
    //       },
    //     });
    //     await this.tasksService.updateSingleTaskData(taskId);
    //     this.tasksService.updateTasksData();
    //   },
    // );
    // //event RequestAccepted(uint256 taskId, RequestType requestType, uint8 requestId);
    // this.newcontract.on(
    //   'RequestAccepted',
    //   async (taskId, requestType, requestId, event) => {
    //     const finalData = {
    //       taskId: String(taskId),
    //       requestId: String(requestId),
    //       requestType: JSON.stringify(requestType),
    //       blockNumber: String(event.blockNumber),
    //       blockHash: String(event.blockHash),
    //       timestamp: String(Date.now()),
    //       event: event.event,
    //       transactionHash: event.transactionHash,
    //       contractAddress: event.address,
    //     };
    //     console.log(finalData);
    //     await this.prisma.event.create({
    //       data: {
    //         name: 'RequestAccepted',
    //         data: JSON.stringify(finalData),
    //       },
    //     });
    //     await this.tasksService.updateSingleTaskData(taskId);
    //     this.tasksService.updateTasksData();
    //   },
    // );
    // //event RequestExecuted(uint256 taskId, RequestType requestType, uint8 requestId, address by);
    // this.newcontract.on(
    //   'RequestExecuted',
    //   async (taskId, requestType, requestId, by, event) => {
    //     const finalData = {
    //       taskId: String(taskId),
    //       requestId: String(requestId),
    //       requestType: JSON.stringify(requestType),
    //       by: by,
    //       blockNumber: String(event.blockNumber),
    //       blockHash: String(event.blockHash),
    //       timestamp: String(Date.now()),
    //       event: event.event,
    //       transactionHash: event.transactionHash,
    //       contractAddress: event.address,
    //     };
    //     console.log(finalData);
    //     await this.prisma.event.create({
    //       data: {
    //         name: 'RequestExecuted',
    //         data: JSON.stringify(finalData),
    //       },
    //     });
    //     await this.tasksService.updateSingleTaskData(taskId);
    //     this.tasksService.updateTasksData();
    //   },
    // );
    // //event TaskCancelled(uint256 taskId);
    // this.newcontract.on('TaskCancelled', async (taskId, event) => {
    //   const finalData = {
    //     taskId: String(taskId),
    //     blockNumber: String(event.blockNumber),
    //     blockHash: String(event.blockHash),
    //     timestamp: String(Date.now()),
    //     event: event.event,
    //     transactionHash: event.transactionHash,
    //     contractAddress: event.address,
    //   };
    //   console.log(finalData);
    //   await this.prisma.event.create({
    //     data: {
    //       name: 'TaskCancelled',
    //       data: JSON.stringify(finalData),
    //     },
    //   });
    //   await this.tasksService.updateSingleTaskData(taskId);
    //   this.tasksService.updateTasksData();
    // });

    //event ApplicationCreated(uint256 taskId, uint16 applicationId, string metadata, Reward[] reward, address proposer, address applicant);
    this.newcontract.on(
      'ApplicationCreated',
      async (
        taskId,
        applicationId,
        metadata,
        reward,
        proposer,
        applicant,
        event,
      ) => {
        console.log('new event');
        console.log(event);
        console.log('event event');
        console.log(event.event);

        const block = await this.web3Provider.getBlock(event['blockNumber']);
        const timestamp = String(block.timestamp) || String(Date.now() / 1000); // Timestamp in seconds

        //storing on the "events" table
        const finalData = {
          event: event,
          contractAddress: event.address,
        };
        console.log(finalData);

        //application special data treating
        const applicationExists = await this.prisma.application.findFirst({
          where: {
            taskId: String(taskId),
            applicationId: String(applicationId),
          },
        });

        if (!applicationExists) {
          if (reward && Array.isArray(reward)) {
            reward = reward.map((singleReward) => JSON.stringify(singleReward));
          }
          console.log('the arg you looking for');
          console.log(event['args'][2]);
          const metadataData =
            await this.tasksService.getApplicationDataFromIPFS(
              String(event['args'][2]),
            );

          await this.prisma.application.create({
            data: {
              taskId: String(taskId),
              applicationId: String(applicationId),
              metadata: metadata,
              reward: reward || [],
              proposer: proposer,
              applicant: applicant,
              metadataDescription: metadataData['description'] || '',
              // eslint-disable-next-line prettier/prettier
              metadataProposedBudget: String(metadataData['budgetPercentageRequested']) || '',
              metadataAdditionalLink: metadataData['additionalLink'] || '',
              metadataDisplayName: metadataData['displayName'] || '',
              timestamp: timestamp,
              transactionHash: event.transactionHash,
              blockNumber: String(event.blockNumber),
            },
          });

          try {
            await this.prisma.event.create({
              data: {
                name: 'ApplicationCreated',
                data: JSON.stringify(finalData),
                eventIndex: String(event.logIndex),
                transactionHash: event.transactionHash,
                blockNumber: String(event.blockNumber),
                taskId: String(taskId),
                address: applicant,
                timestamp: timestamp,
              },
            });
          } catch (err) {
            console.log('error submiting application');
          }
          this.usersService.checkIfUserExistsOnTheChain(applicant);
        }
      },
    );

    // //event TaskCreated(uint256 taskId, string metadata, uint64 deadline, ERC20Transfer[] budget, address manager, PreapprovedApplication[] preapproved);
    this.newcontract.on(
      'TaskCreated',
      async (
        taskId,
        metadata,
        deadline,
        budget,
        creator,
        manager,
        preapproved,
        event,
      ) => {
        console.log('new event');
        console.log(event);
        console.log('event event');
        console.log(event.event);

        const block = await this.web3Provider.getBlock(event['blockNumber']);
        const timestamp = String(block.timestamp) || String(Date.now() / 1000); // Timestamp in seconds

        //storing on the "events" table
        const finalData = {
          event: event,
          contractAddress: event.address,
        };
        console.log(finalData);
        await this.prisma.event.create({
          data: {
            name: 'TaskCreated',
            data: JSON.stringify(finalData),
            eventIndex: String(event.logIndex),
            transactionHash: event.transactionHash,
            blockNumber: String(event.blockNumber),
            taskId: String(taskId),
            address: manager,
            timestamp: timestamp,
          },
        });
        this.usersService.checkIfUserExistsOnTheChain(manager);
        this.tasksService.updateSingleTaskData(Number(taskId));
      },
    );

    // event ApplicationAccepted(uint256 taskId, uint16 application, address proposer, address applicant);
    this.newcontract.on(
      'ApplicationAccepted',
      async (taskId, applicationId, proposer, applicant, event) => {
        console.log('new event');
        console.log(event);
        console.log('event event');
        console.log(event.event);

        const block = await this.web3Provider.getBlock(event['blockNumber']);
        const timestamp = String(block.timestamp) || String(Date.now() / 1000); // Timestamp in seconds

        //storing on the "events" table
        const finalData = {
          event: event,
          contractAddress: event.address,
        };
        console.log(finalData);
        try {
          await this.prisma.event.create({
            data: {
              name: 'ApplicationAccepted',
              data: JSON.stringify(finalData),
              eventIndex: String(event.logIndex),
              transactionHash: event.transactionHash,
              blockNumber: String(event.blockNumber),
              taskId: String(taskId),
              address: applicant,
              timestamp: timestamp,
            },
          });
        } catch (err) {
          console.log('error saving event');
        }

        this.usersService.checkIfUserExistsOnTheChain(applicant);

        //Updating application to accepted
        console.log('updating the application');

        await this.prisma.application.updateMany({
          where: {
            taskId: String(taskId),
            applicationId: String(applicationId),
          },
          data: {
            accepted: true,
          },
        });
      },
    );

    // event TaskTaken(uint256 taskId, uint16 applicationId, address proposer, address executor);
    this.newcontract.on(
      'TaskTaken',
      async (taskId, applicationId, proposer, executor, event) => {
        console.log('new event');
        console.log(event);
        console.log('event event');
        console.log(event.event);

        const block = await this.web3Provider.getBlock(event['blockNumber']);
        const timestamp = String(block.timestamp) || String(Date.now() / 1000); // Timestamp in seconds

        //storing on the "events" table
        const finalData = {
          event: event,
          contractAddress: event.address,
        };
        console.log(finalData);
        await this.prisma.event.create({
          data: {
            name: 'TaskTaken',
            data: JSON.stringify(finalData),
            eventIndex: String(event.logIndex),
            transactionHash: event.transactionHash,
            blockNumber: String(event.blockNumber),
            taskId: String(taskId),
            address: executor,
            timestamp: timestamp,
          },
        });
        this.usersService.checkIfUserExistsOnTheChain(executor);
        //setting the task as taken and the application as well
        console.log('updating application');
        await this.prisma.application.updateMany({
          where: {
            taskId: String(taskId),
            applicationId: String(applicationId),
          },
          data: {
            accepted: true,
            taken: true,
          },
        });
        console.log('updating task');
        await this.prisma.task.update({
          where: {
            taskId: String(taskId),
          },
          data: {
            status: String(1),
            executor,
          },
        });
        this.tasksService.updateSingleTaskData(Number(taskId));
      },
    );

    //event SubmissionCreated(uint256 taskId, uint8 submissionId, string metadata, address proposer, address executor);
    this.newcontract.on(
      'SubmissionCreated',
      async (taskId, submissionId, metadata, proposer, executor, event) => {
        console.log('new event');
        console.log(event);
        console.log('event event');
        console.log(event.event);

        const block = await this.web3Provider.getBlock(event['blockNumber']);
        const timestamp = String(block.timestamp) || String(Date.now() / 1000); // Timestamp in seconds

        //storing on the "events" table
        const finalData = {
          event: event,
          contractAddress: event.address,
        };
        console.log(finalData);

        //application special data treating
        const applicationExists = await this.prisma.submission.findFirst({
          where: {
            taskId: String(taskId),
            submissionId: String(submissionId),
          },
        });

        if (!applicationExists) {
          console.log('getting submission metadata');
          console.log('the arg you looking for');
          console.log(event['args'][2]);
          const metadataData =
            await this.tasksService.getSubmissionDataFromIPFS(
              String(event['args'][2]),
            );
          console.log('creating submission');
          await this.prisma.submission.create({
            data: {
              taskId: String(taskId),
              submissionId: String(submissionId),
              metadata: metadata,
              proposer: proposer,
              applicant: executor,
              metadataDescription: metadataData['description'] || '',
              // eslint-disable-next-line prettier/prettier
              metadataAdditionalLinks: metadataData['links'] || [],
              timestamp: timestamp,
              transactionHash: event.transactionHash,
              blockNumber: String(event.blockNumber),
            },
          });
          console.log('creating event');
          try {
            await this.prisma.event.create({
              data: {
                name: 'SubmissionCreated',
                data: JSON.stringify(finalData),
                eventIndex: String(event.logIndex),
                transactionHash: event.transactionHash,
                blockNumber: String(event.blockNumber),
                taskId: String(taskId),
                address: executor,
                timestamp: timestamp,
              },
            });
          } catch (err) {
            console.log('error submiting application');
          }
          console.log('checking user');
          this.usersService.checkIfUserExistsOnTheChain(executor);
        }
      },
    );

    //event SubmissionReviewed(uint256 taskId, uint8 submissionId, SubmissionJudgement judgement, string feedback, address proposer, address executor);
    this.newcontract.on(
      'SubmissionReviewed',
      async (
        taskId,
        submissionId,
        judgement,
        feedback,
        proposer,
        executor,
        event,
      ) => {
        console.log('new event');
        console.log(event);
        console.log('event event');
        console.log(event.event);

        // const judmentsOptions = ['None', 'Accepted', 'Rejected'];

        const block = await this.web3Provider.getBlock(event['blockNumber']);
        const timestamp = String(block.timestamp) || String(Date.now() / 1000); // Timestamp in seconds

        //storing on the "events" table
        const finalData = {
          event: event,
          contractAddress: event.address,
        };
        console.log(finalData);
        try {
          await this.prisma.event.create({
            data: {
              name: 'SubmissionReviewed',
              data: JSON.stringify(finalData),
              eventIndex: String(event.logIndex),
              transactionHash: event.transactionHash,
              blockNumber: String(event.blockNumber),
              taskId: String(taskId),
              address: executor,
              timestamp: timestamp,
            },
          });
        } catch (err) {
          console.log('error in submission review');
        }

        const metadataData = await this.tasksService.getSubmissionDataFromIPFS(
          String(event['args'][3]),
        );
        //setting the task as taken and the application as well
        console.log('updating application');
        await this.prisma.submission.updateMany({
          where: {
            taskId: String(taskId),
            submissionId: String(submissionId),
          },
          data: {
            accepted: true,
            reviewed: true,
            review: String(judgement),
            metadataReview: feedback,
            metadataReviewFeedback: metadataData['description'],
            timestampReview: timestamp,
          },
        });

        this.usersService.checkIfUserExistsOnTheChain(executor);
      },
    );

    //event TaskCompleted(uint256 taskId, address proposer, address executor);
    this.newcontract.on(
      'TaskCompleted',
      async (taskId, proposer, executor, event) => {
        console.log('new event');
        console.log(event);
        console.log('event event');
        console.log(event.event);

        const block = await this.web3Provider.getBlock(event['blockNumber']);
        const timestamp = String(block.timestamp) || String(Date.now() / 1000); // Timestamp in seconds

        //storing on the "events" table
        const finalData = {
          event: event,
          contractAddress: event.address,
        };
        console.log(finalData);
        await this.prisma.event.create({
          data: {
            name: 'TaskCompleted',
            data: JSON.stringify(finalData),
            eventIndex: String(event.logIndex),
            transactionHash: event.transactionHash,
            blockNumber: String(event.blockNumber),
            taskId: String(taskId),
            address: executor,
            timestamp: timestamp,
          },
        });
        this.usersService.checkIfUserExistsOnTheChain(executor);
      },
    );
  }
}
