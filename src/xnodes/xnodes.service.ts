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
import { UtilsService } from '../utils/utils.service';
import { OpenmeshExpertsAuthService } from 'src/openmesh-experts/openmesh-experts-auth.service';
import { CreateXnodeDto, GetXnodeDto, UpdateXnodeDto } from './dto/xnodes.dto';

@Injectable()
export class XnodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly openmeshExpertsAuthService: OpenmeshExpertsAuthService,
  ) {}

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

    return await this.prisma.xnode.create({
      data: {
        openmeshExpertUserId: user.id,
        ...dataBody,
      },
    });
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
