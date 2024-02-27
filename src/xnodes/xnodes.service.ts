/* eslint-disable prefer-const */
import {
  ConflictException,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as path from 'path';
import * as Papa from 'papaparse';
import * as fs from 'fs';

// import { import_ } from '@brillout/import';
import { ethers } from 'ethers';
import * as taskContractABI from '../contracts/taskContractABI.json';
import * as erc20ContractABI from '../contracts/erc20ContractABI.json';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import Hex from 'crypto-js/enc-hex';
import hmacSHA1 from 'crypto-js/hmac-sha1';
import { createHmac } from 'crypto';
import cloneDeep from 'lodash/cloneDeep';

import { PrismaService } from '../database/prisma.service';
import { Request, response } from 'express';
import axios from 'axios';
import { UtilsService } from '../utils/utils.service';
import { OpenmeshExpertsAuthService } from 'src/openmesh-experts/openmesh-experts-auth.service';
import {
  ConnectAPI,
  CreateXnodeDto,
  GetXnodeDto,
  StoreXnodeData,
  StoreXnodeSigningMessageDataDTO,
  UpdateXnodeDto,
} from './dto/xnodes.dto';
import { features } from 'process';
import {
  defaultSourcePayload,
  defaultStreamProcessorPayload,
  defaultWSPayload,
} from './utils/constants';
import { generateUUID8, generateUUID16 } from './utils/uuidGenerator';

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

    if (!user.equinixAPIKey) {
      throw new BadRequestException(
        'User need to have a valid equinix api key',
        {
          cause: new Error(),
          description: 'User need to have a valid equinix api key',
        },
      );
    }

    const { features, serverNumber, websocketEnabled, status, ...dataNode } =
      dataBody;

    const uuid = generateUUID8();
    const finalFeatures = [];

    if (features.length > 0) {
      finalFeatures.push(defaultStreamProcessorPayload);
      finalFeatures.push({
        ...defaultSourcePayload,
        workloads: features, // Could be ambiguous (features:workloads:features)
      });
    }

    // Private UnifiedAPI Websocket Endpoint
    if (websocketEnabled) {
      finalFeatures.push(defaultWSPayload);
    }
  // ValidationCloud ingest Ethereum data
  let validationCloudEthereum = false
  if (validationCloudEthereum) {
    finalFeatures.push(defaultSourcePayload)
  }
  //ValidationCloud ingest Polygon data
  let validationCloudPolygon = false
  if (validationCloudPolygon) {
    finalFeatures.push(defaultSourcePayload)
  }

  // XXX: This is a HACK! This is a HACK! This is a HACK! This is a HACK! This is a HACK!
  // NOTE (Tomas): Bruno pls change this :)
  // To fix this:
  //  Add a flag sort of like "websocketEnabled" that gets passed along here
  //  use that as the condition to deploy this thing. Otherwise people who enter an API key once will
  //  have all future XNodes include the ValidationCloud collector
  // Also this should work for the Polygon version too! So one flag for each.
  //  There's more work to be done on the collector before that would work.
  // Second conditional for validationCloudAPIKeyPolygon to get add workload.
  if (user.validationCloudAPIKeyEthereum != null || validationCloudEthereum) {
    // Should be inside 'if': 'ValidationcloudEnabled"
    
    // TO-DO LATER: Pass parameter as a separate kafka topic, to support separate ethereum, polygon or other streams at the same time.

    let scuffedPayload = { ...defaultSourcePayload };
    let apiKey = user.validationCloudAPIKeyEthereum;

    // NOTE(Tomas): Docs aren't that easy to interpret, chatgpt said env variables set like this are added as OS env variables on the container. ( it works I promise :) )
    scuffedPayload.args +=
      ' --set env.ETHEREUM_NODE_WS_URL=https://mainnet.ethereum.validationcloud.io/v1/wss/'+apiKey;
    scuffedPayload.args +=
      ' --set env.ETHEREUM_NODE_HTTP_URL=wss://mainnet.ethereum.validationcloud.io/v1/'+apiKey;
    scuffedPayload.args += ' --set env.ETHEREUM_NODE_SECRET='+apiKey;

    // NOTE(Tomas): Has to have at least one workload.
    //  Here we piggyback off of ethereum since it's the closest config.
    //  Ideally all this code would be abstracted/burned.
    scuffedPayload['workloads'] = ['ethereum'];

    finalFeatures.push(scuffedPayload);
  }

    const payload = {
      builds: [
        {
          auth_token: user.equinixAPIKey,
          aws_role_arn: 'arn:aws:iam::849828677909:role/super',
          ccm_enabled: 'true',
          client_name: `${dataNode.name.replace(/\s+/g, '')}-${
            user.id
          }-${generateUUID16()}`,
          count_x86: JSON.stringify(serverNumber),
          features: finalFeatures,
          kubernetes_version: '1.25.10-00',
          metro: dataNode.serverLoc,
          product_version: 'v3',
          single_xnode: dataNode.type === 'validator' ? 'true' : 'false',
        },
      ],
      adoBuildTag: uuid,
    };
    console.log('saiu payload');
    console.log(payload);
    console.log('features');
    console.log(finalFeatures);

    const payloadStr = JSON.stringify(payload);
    console.log('saiu payloadStr');
    const signature = createHmac('sha1', this.SECRET)
      .update(payloadStr)
      .digest('hex');
    console.log('saiu signature new');
    console.log(signature);

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

    const xnode = await this.prisma.xnode.create({
      data: {
        openmeshExpertUserId: user.id,
        adoBuildTag: uuid,
        features: JSON.stringify(features),
        serverNumber: JSON.stringify(serverNumber),
        websocketEnabled,
        status: 'Deploying',
        ...dataNode,
      },
    });

    console.log('went through it');

    await this.getXnodeDeploymentLog(uuid, xnode.id);

    return xnode;
  }

  //since the azure pipeline does not have a websocket to connect to see when the deployment is ready, we need to call the api every 2 seconds to see if the deploy was successfull
  async getXnodeDeploymentLog(tagId: any, xnodeId) {
    return new Promise<void>(async (resolve, reject) => {
      const encodedCredentials = Buffer.from(`user:${this.PAT}`).toString(
        'base64',
      );

      let interval: NodeJS.Timeout; // Variável para armazenar o intervalo

      const fetchBuildId = async () => {
        try {
          const response = await axios.get(
            `https://dev.azure.com/gdafund/L3/_apis/build/builds?tagFilters=${tagId}`,
            {
              headers: {
                Authorization: `Basic ${encodedCredentials}`,
              },
            },
          );
          console.log('getting data build');

          if (response.data?.value.length > 0) {
            const buildId = response.data.value[0].id;
            console.log('found build');
            console.log(buildId);
            await this.prisma.xnode.update({
              where: {
                id: xnodeId,
              },
              data: {
                buildId: JSON.stringify(buildId),
              },
            });
            this.getBuildLogs(buildId, xnodeId);
            clearInterval(interval); // Limpa o intervalo quando a condição de sucesso for atendida
            resolve(); // Resolve a promessa
          }
        } catch (error) {
          console.error('error getting build:', error);
          clearInterval(interval); // Limpa o intervalo em caso de erro
          reject(error); // Rejeita a promessa
        }
      };

      await fetchBuildId();

      interval = setInterval(fetchBuildId, 10000); // Configura o intervalo
    });
  }

  async getBuildLogs(buildId: string, xnodeId: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const encodedCredentials = Buffer.from(`user:${this.PAT}`).toString(
        'base64',
      );

      let interval: NodeJS.Timeout;

      const fetchLogs = async () => {
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
            if (response.data.value.some((log: any) => log.id > 31)) {
              console.log('YES LOG DONE');
              await this.prisma.xnode.update({
                where: {
                  id: xnodeId,
                },
                data: {
                  status: 'Running',
                },
              });
              clearInterval(interval);
              resolve(); // Resolve a promessa quando a condição é atendida
            }
          }
        } catch (error) {
          console.error('Erro ao buscar os logs:', error);
          clearInterval(interval);
          reject(error); // Rejeita a promessa em caso de erro
        }
      };

      await fetchLogs();

      interval = setInterval(fetchLogs, 20000);
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

  async storeXnodeData(data: StoreXnodeData) {
    console.log('the log data');

    console.log(data);
    const { buildId, ...finalData } = data;

    const buildIdExists = await this.prisma.xnode.findFirst({
      where: {
        buildId,
      },
    });

    if (!buildIdExists) {
      throw new BadRequestException('BuildId not found', {
        cause: new Error(),
        description: 'BuildId not found',
      });
    }
    console.log(data);

    //if you receive the data, it also means the node has been deployed succesfully
    return await this.prisma.xnode.updateMany({
      where: {
        buildId,
      },
      data: {
        status: 'Running',
        ...finalData,
      },
    });
  }

  async storeXnodeSigningMessage(
    dataBody: StoreXnodeSigningMessageDataDTO,
    req: Request,
  ) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.openmeshExpertsAuthService.verifySessionToken(
      accessToken,
    );

    const xnodeExists = await this.prisma.xnode.findFirst({
      where: {
        id: dataBody.xnodeId,
        openmeshExpertUserId: user.id,
      },
    });

    if (!xnodeExists)
      throw new BadRequestException(`Xnode not found`, {
        cause: new Error(),
        description: `Xnode not found`,
      });

    return await this.prisma.xnode.update({
      where: {
        id: dataBody.xnodeId,
      },
      data: {
        validatorSignature: dataBody.signedMessage,
      },
    });
  }

  async connectEquinixAPI(dataBody: ConnectAPI, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.openmeshExpertsAuthService.verifySessionToken(
      accessToken,
    );

    // validating the equinix key:
    const config = {
      method: 'get',
      url: 'https://api.equinix.com/metal/v1/user',
      headers: {
        Accept: 'application/json',
        'X-Auth-Token': dataBody.apiKey,
      },
    };

    let dado;

    try {
      await axios(config).then(function (response) {
        dado = response.data;
      });
    } catch (err) {
      console.log(err.response.data.error);
      console.log(err.response);
      throw new BadRequestException(`Error validating api key`, {
        cause: new Error(),
        description: `${err.response.data.error}`,
      });
    }

    //if the api is valid, store in user account
    await this.prisma.openmeshExpertUser.update({
      where: {
        id: user.id,
      },
      data: {
        equinixAPIKey: dataBody.apiKey,
      },
    });

    return;
  }

  async connectValidationCloudAPIEthereum(dataBody: ConnectAPI, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.openmeshExpertsAuthService.verifySessionToken(
      accessToken,
    );

    const dataBodyAPI = {
      jsonrpc: '2.0',
      method: 'eth_accounts',
      params: [],
      id: 1,
    };

    // validating the key:
    const config = {
      method: 'post',
      url: `https://mainnet.ethereum.validationcloud.io/v1/${dataBody.apiKey}`,
      headers: {
        Accept: 'application/json',
      },
      data: dataBodyAPI,
    };

    let dado;

    try {
      await axios(config).then(function (response) {
        dado = response.data;
      });
    } catch (err) {
      console.log(err.response.data.error);
      console.log(err.response);
      throw new BadRequestException(`Error validating api key`, {
        cause: new Error(),
        description: `${err.response.data.error}`,
      });
    }

    if (dado?.error) {
      throw new BadRequestException(`Error validating api key`, {
        cause: new Error(),
        description: `${dado?.error}`,
      });
    }

    //if the api is valid, store in user account
    await this.prisma.openmeshExpertUser.update({
      where: {
        id: user.id,
      },
      data: {
        validationCloudAPIKeyEthereum: dataBody.apiKey,
      },
    });

    return;
  }

  async connectValidationCloudAPIPolygon(dataBody: ConnectAPI, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.openmeshExpertsAuthService.verifySessionToken(
      accessToken,
    );

    const dataBodyAPI = {
      jsonrpc: '2.0',
      method: 'eth_accounts',
      params: [],
      id: 1,
    };

    // validating the key:
    const config = {
      method: 'post',
      url: `https://mainnet.polygon.validationcloud.io/v1/${dataBody.apiKey}`,
      headers: {
        Accept: 'application/json',
      },
      data: dataBodyAPI,
    };

    let dado;

    try {
      await axios(config).then(function (response) {
        dado = response.data;
      });
    } catch (err) {
      console.log(err.response.data.error);
      console.log(err.response);
      throw new BadRequestException(`Error validating api key`, {
        cause: new Error(),
        description: `${err.response.data.error}`,
      });
    }

    if (dado?.error) {
      throw new BadRequestException(`Error validating api key`, {
        cause: new Error(),
        description: `${dado?.error}`,
      });
    }

    //if the api is valid, store in user account
    await this.prisma.openmeshExpertUser.update({
      where: {
        id: user.id,
      },
      data: {
        validationCloudAPIKeyPolygon: dataBody.apiKey,
      },
    });

    return;
  }

  async connectAivenAPI(dataBody: ConnectAPI, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.openmeshExpertsAuthService.verifySessionToken(
      accessToken,
    );

    // validating the equinix key:
    const config = {
      method: 'get',
      url: 'https://api.aiven.io/v1/project',
      headers: {
        Accept: 'application/json',
        Authorization: `aivenv1 ${dataBody.apiKey}`,
      },
    };

    let data;

    try {
      await axios(config).then(function (response) {
        data = response.data;
      });
    } catch (err) {
      console.log(err.response.data.error);
      console.log(err.response);
      throw new BadRequestException(`Error validating api key`, {
        cause: new Error(),
        description: `${err.response.data.error}`,
      });
    }

    //validate if user is admin
    const keys = Object.keys(data?.project_membership);
    if (data?.project_membership[keys[0]] !== 'admin') {
      throw new BadRequestException(`project_membership is not an admin`, {
        cause: new Error(),
        description: `project_membership is not an admin`,
      });
    }

    //validate if it has server deployed with grafana:
    if (data.projects?.length === 0) {
      throw new BadRequestException(
        `User should have at least one project created`,
        {
          cause: new Error(),
          description: `User should have at least one project created`,
        },
      );
    }

    let getGrafanaURIParams = await this.getGrafanaServiceFromAivenAPI(
      data,
      dataBody.apiKey,
    );

    //if it does not have a grafana service data, just deploy a new one
    if (!getGrafanaURIParams) {
      getGrafanaURIParams = await this.deployGrafanaServiceFromAivenAPI(
        data,
        dataBody.apiKey,
      );
    }

    //if the api is valid, store in user account
    const upd = await this.prisma.openmeshExpertUser.update({
      where: {
        id: user.id,
      },
      data: {
        aivenAPIKey: dataBody.apiKey,
        aivenAPIServiceUriParams: JSON.stringify(getGrafanaURIParams),
      },
    });

    return upd;
  }

  async getGrafanaServiceFromAivenAPI(data: any, apiKey: string) {
    if (data?.projects.length === 0) {
      throw new BadRequestException(
        `A project was not found, make sure to create one.`,
        {
          cause: new Error(),
          description: `A project was not found, make sure to create one.`,
        },
      );
    }
    for (let i = 0; i < data?.projects.length; i++) {
      const projectName = data?.projects[i].project_name;

      // validating the equinix key:
      const config = {
        method: 'get',
        url: `https://api.aiven.io/v1/project/${projectName}/service`,
        headers: {
          Accept: 'application/json',
          Authorization: `aivenv1 ${apiKey}`,
        },
      };

      let dataRes;

      try {
        await axios(config).then(function (response) {
          dataRes = response.data;
        });
      } catch (err) {
        console.log(err.response.data.error);
        console.log(err.response);
        throw new BadRequestException(`Error getting services`, {
          cause: new Error(),
          description: `${err.response.data.error}`,
        });
      }

      if (dataRes?.services?.length > 0) {
        for (let j = 0; j < dataRes?.services.length; j++) {
          if (dataRes?.services[j].service_type === 'grafana') {
            return dataRes?.services[j].service_uri_params;
          }
        }
      }
    }
  }
  async deployGrafanaServiceFromAivenAPI(data: any, apiKey: string) {
    const databody = {
      cloud: 'do-syd',
      group_name: 'default',
      plan: 'startup-1',
      service_name: 'openmesh-grafana-123',
      service_type: 'grafana',
      project_vpc_id: null,
      user_config: {},
      tags: {},
    };
    for (let i = 0; i < data?.projects.length; i++) {
      const projectName = data?.projects[i].project_name;

      // validating the equinix key:
      const config = {
        method: 'post',
        url: `https://api.aiven.io/v1/project/${projectName}/service`,
        headers: {
          Accept: 'application/json',
          Authorization: `aivenv1 ${apiKey}`,
        },
        data: databody,
      };

      let dataRes;

      try {
        await axios(config).then(function (response) {
          dataRes = response.data;
        });
      } catch (err) {
        console.log(err.response.data.error);
        console.log(err.response);
      }

      if (dataRes?.service) {
        return dataRes.service.service_uri_params;
      }
    }

    // if no project works, just trhows error
    throw new BadRequestException('Grafana service deploy failed', {
      cause: new Error(),
      description: 'Grafana service deploy failed',
    });
  }

  async storeDb() {
    const data = await this.prisma.xnodeClaimActivities.findMany();
    const csv = Papa.unparse(data);

    const filePath = path.join(__dirname, 'xnodeClaimActivities.csv');
    fs.writeFileSync(filePath, csv);

    return { message: 'CSV file created', filePath };
  }

  // async deleteTable() {
  //   await this.prisma.$queryRaw`DROP EXTENSION timescaledb;`;
  //   console.log('Tabela "chunk" excluída com sucesso.');
  // }
}
