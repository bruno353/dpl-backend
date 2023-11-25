/* eslint-disable prefer-const */
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

import Hex from 'crypto-js/enc-hex';
import hmacSHA1 from 'crypto-js/hmac-sha1';

import { PrismaService } from '../database/prisma.service';
import { Request, response } from 'express';
import axios from 'axios';
import { UtilsService } from '../utils/utils.service';
import { OpenmeshExpertsAuthService } from 'src/openmesh-experts/openmesh-experts-auth.service';
import { CreateXnodeDto, GetXnodeDto, UpdateXnodeDto } from './dto/xnodes.dto';
import { features } from 'process';
import {
  defaultSourcePayload,
  defaultStreamProcessorPayload,
  defaultWSPayload,
} from './utils/constants';
import { generateUUID8 } from './utils/uuidGenerator';

@Injectable()
export class XnodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly openmeshExpertsAuthService: OpenmeshExpertsAuthService,
  ) {}

  SECRET = process.env.XNODE_SECRET;
  WEBHOOK_URL = process.env.XNODE_WEBHOOK_URL;
  PAT = process.env.AZURE_PAT;

  async createXnode(dataBody: CreateXnodeDto, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.openmeshExpertsAuthService.verifySessionToken(
      accessToken,
    );

    const xnodes = await this.prisma.xnode.findMany({
      where: {
        openmeshExpertUserId: user.id,
      },
    });

    if (xnodes.length > 100) {
      throw new BadRequestException('Xnode limit reached', {
        cause: new Error(),
        description: 'Xnode limit reached',
      });
    }

    const { features, serverNumber, websocketEnabled, ...dataNode } = dataBody;

    const uuid = generateUUID8();
    const finalFeatures = [];

    if (features.length > 0) {
      finalFeatures.push(defaultStreamProcessorPayload);
      finalFeatures.push({
        ...defaultSourcePayload,
        workloads: features,
      });
    }

    if (websocketEnabled) {
      finalFeatures.push(defaultWSPayload);
    }

    const payload = {
      builds: [
        {
          auth_token: 'KanJurHojus75VVgupdaEJY4BkqimRjW',
          aws_role_arn: 'arn:aws:iam::849828677909:role/super',
          ccm_enabled: 'true',
          client_name: dataNode.name,
          count_x86: JSON.stringify(serverNumber),
          features,
          kubernetes_version: '1.25.10-00',
          metro: dataNode.serverLoc,
          product_version: 'v3',
          single_xnode: 'false',
        },
      ],
      adoBuildTag: uuid,
    };
    const payloadStr = JSON.stringify(payload);

    const signature = Hex.stringify(hmacSHA1(payloadStr, this.SECRET));

    try {
      const config = {
        method: 'post',
        url: this.WEBHOOK_URL,
        headers: {
          'X-Hub-Signature': `sha1=${signature}`,
          'Content-Type': 'application/json',
        },
        data: payloadStr,
      };
      await axios(config).then(function (response) {
        console.log('this is the response');
        console.log(response.data);
      });
    } catch (err) {
      console.log('error happened during runtime');
      console.log(err);
    }

    await this.getXnodeDeploymentLog(uuid);

    console.log('went through it');

    return await this.prisma.xnode.create({
      data: {
        openmeshExpertUserId: user.id,
        adoBuildTag: uuid,
        features: JSON.stringify(features),
        serverNumber: JSON.stringify(serverNumber),
        websocketEnabled,
        ...dataNode,
      },
    });
  }

  //since the azure pipeline does not have a websocket to connect to see when the deployment is ready, we need to call the api every 2 seconds to see if the deploy was successfull
  async getXnodeDeploymentLog(tagId: any) {
    let interval: NodeJS.Timeout;

    console.log('started getting the build tag');
    console.log(tagId);

    const encodedCredentials = Buffer.from(`user:${this.PAT}`).toString(
      'base64',
    );

    async function fetchBuildId() {
      console.log('searching build');
      let buildId;
      try {
        const response = await axios.get(
          `https://dev.azure.com/gdafund/L3/_apis/build/builds?tagFilters=${tagId}`,
          {
            headers: {
              Authorization: `Basic ${encodedCredentials}`,
            },
          },
        );

        if (response.data?.value.length > 0) {
          console.log('there is a build');
          console.log(buildId);
          buildId = response.data.value[0].id;
          await this.getBuildLogs(buildId);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('error getting build:', error);
      }
    }
    fetchBuildId();
    interval = setInterval(fetchBuildId, 10000);

    return () => {
      clearInterval(interval);
    };
  }

  async getBuildLogs(buildId: string) {
    let interval: NodeJS.Timeout;
    console.log('now getting the build data');
    console.log(buildId);

    const encodedCredentials = Buffer.from(`user:${this.PAT}`).toString(
      'base64',
    );

    async function fetchLogs() {
      try {
        const response = await axios.get(
          `https://dev.azure.com/gdafund/L3/_apis/build/builds/${buildId}/logs?api-version=7.1-preview.2`,
          {
            headers: {
              Authorization: `Basic ${encodedCredentials}`,
            },
          },
        );

        if (response.data?.value) {
          console.log('the response data');
          console.log(response.data);
          if (response.data.value.some((log: any) => log.id > 31)) {
            console.log('YES LOG DONE');
            clearInterval(interval);
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao buscar os logs:', error);
      }
    }

    console.log('went trhough fetch logs');

    fetchLogs();
    interval = setInterval(fetchLogs, 20000);

    return () => {
      clearInterval(interval);
    };
  }

  async updateXnode(dataBody: UpdateXnodeDto, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.openmeshExpertsAuthService.verifySessionToken(
      accessToken,
    );

    const xnodes = await this.prisma.xnode.findFirst({
      where: {
        id: dataBody.xnodeId,
        openmeshExpertUserId: user.id,
      },
    });

    if (!xnodes) {
      throw new BadRequestException('Xnode not found', {
        cause: new Error(),
        description: 'Xnode not found',
      });
    }

    const { xnodeId, ...finalBody } = dataBody;

    return await this.prisma.xnode.update({
      data: {
        ...finalBody,
      },
      where: {
        id: xnodeId,
      },
    });
  }

  async getXnode(dataBody: GetXnodeDto, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.openmeshExpertsAuthService.verifySessionToken(
      accessToken,
    );

    return await this.prisma.xnode.findFirst({
      where: {
        id: dataBody.id,
        openmeshExpertUserId: user.id,
      },
    });
  }

  async getXnodes(req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.openmeshExpertsAuthService.verifySessionToken(
      accessToken,
    );

    return await this.prisma.xnode.findMany({
      where: {
        openmeshExpertUserId: user.id,
      },
    });
  }

  async getNodesValidatorsStats() {
    const nodesListing = await this.prisma.xnode.findMany({
      where: {
        type: 'validator',
      },
    });

    return {
      stats: {
        totalValidators: nodesListing.length,
        totalStakeAmount: 0,
        totalAverageReward: 0,
        averagePayoutPeriod: 'Every 7 days',
      },
      nodes: nodesListing,
    };
  }

  async getXnodeWithNodesValidatorsStats(data: GetXnodeDto) {
    const node = await this.prisma.xnode.findFirst({
      where: {
        id: data.id,
      },
      include: {
        XnodeClaimActivities: true,
      },
    });
    const nodesListing = await this.prisma.xnode.findMany({
      where: {
        type: 'validator',
      },
    });

    return {
      node: node,
      stats: {
        totalValidators: nodesListing.length,
        totalStakeAmount: 0,
        totalAverageReward: 0,
        averagePayoutPeriod: 'Every 7 days',
      },
      nodes: nodesListing,
    };
  }
}
