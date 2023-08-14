import { BadRequestException, Injectable } from '@nestjs/common';

import { join } from 'path';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });
import { ethers } from 'ethers';
import { createHash, createHmac } from 'crypto';
import { Request, response } from 'express';

import { google } from 'googleapis';
import { Storage } from '@google-cloud/storage';
import * as AWS from 'aws-sdk';
import { PrismaService } from '../database/prisma.service';

import axios from 'axios';

@Injectable()
export class UtilsService {
  constructor(private readonly prisma: PrismaService) {}

  //setting variables:
  web3UrlProvider = process.env.WEB3_URL_PROVIDER;
  web3Provider = new ethers.providers.JsonRpcProvider(this.web3UrlProvider);

  apiCovalentBase = process.env.COVALENT_API_BASE_URL;
  apiCovalentKey = process.env.COVALENT_API_KEY;
  usdcTokenAddress = process.env.USDC_TOKEN_ADDRESS;
  usdtTokenAddress = process.env.USDT_TOKEN_ADDRESS;
  wEthTokenAddress = process.env.WETH_TOKEN_ADDRESS;
  webhookSigningKey = 'audjduisodoid-213424-214214-ewqewqeqwe-kskak';

  //function used internaly to get all  the price from the tokens allowed to be set as payments on the protocol (so we can give to the user the estimate amount of dollars the task is worth it)
  public async getWETHPriceTokens(tokenAddress: string): Promise<number> {
    const url = `${this.apiCovalentBase}/pricing/historical_by_addresses_v2/matic-mainnet/USD/${tokenAddress}/?key=${this.apiCovalentKey}`;
    let response = 0;
    try {
      const dado = await axios.get(url);
      if (dado) {
        response = dado.data[0].prices[0].price;
      }
      console.log('eth price');
      console.log(url);
    } catch (err) {
      console.log('error api covalent price');
      console.log(err);
    }
    return response;
  }

  async calendlyWebhook(dataBody: any, req: Request) {
    console.log('chamado');
    console.log(dataBody);
    const keySignature = String(req.headers['calendly-webhook-signature']);
    console.log('the signature key');
    console.log(keySignature);
    const { t, signature } = keySignature.split(',').reduce(
      (acc, currentValue) => {
        const [key, value] = currentValue.split('=');

        if (key === 't') {
          // UNIX timestamp
          acc.t = value;
        }

        if (key === 'v1') {
          acc.signature = value;
        }

        return acc;
      },
      {
        t: '',
        signature: '',
      },
    );

    if (!t || !signature) throw new Error('Invalid Signature');
    console.log(t);
    console.log(signature);

    console.log('checking signature');

    const data = t + '.' + JSON.stringify(req.body);

    const expectedSignature = createHmac('sha256', this.webhookSigningKey)
      .update(data, 'utf8')
      .digest('hex');

    // Determine the expected signature by computing an HMAC with the SHA256 hash function.

    console.log('expected hash');
    console.log(expectedSignature);
    console.log('signature');
    console.log(signature);

    if (expectedSignature !== signature) {
      // Signature is invalid!
      throw new Error('Invalid Signature');
    }
    // chamando a api:
    //   const configAPI = {
    //     method: 'post',
    //     url: 'https://api.calendly.com/scheduling_links',
    //     headers: {
    //       accept: 'application/json',
    //       client_id: this.clientIdSRMAPI,
    //       access_token: accessTokenSRM,
    //     },
    //   };

    //   let operacaoSigma;
    //   try {
    //     await axios(configAPI).then(function (response) {
    //       operacaoSigma = response.data;
    //     });
    //   } catch (err) {
    //     console.log(err);
    //   }
    // }
  }
}
