import { BadRequestException, Injectable } from '@nestjs/common';

import { join } from 'path';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });
import { ethers } from 'ethers';
import * as chainlinkPriceFeedABI from '../contracts/chainlinkPriceFeed.json';

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
  web3UrlProviderEthereum = process.env.WEB3_URL_PROVIDER_ETHEREUM;
  web3Provider = new ethers.providers.JsonRpcProvider(this.web3UrlProvider);
  web3ProviderEthereum = new ethers.providers.JsonRpcProvider(
    this.web3UrlProviderEthereum,
  );

  viewPrivateKey = process.env.VIEW_PRIVATE_KEY;

  apiCovalentBase = process.env.COVALENT_API_BASE_URL;
  apiCovalentKey = process.env.COVALENT_API_KEY;
  usdcTokenAddress = process.env.USDC_TOKEN_ADDRESS;
  usdtTokenAddress = process.env.USDT_TOKEN_ADDRESS;
  wEthTokenAddress = process.env.WETH_TOKEN_ADDRESS;

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

  //using decentralized ways to get prices
  //docs: https://docs.chain.link/data-feeds/using-data-feeds https://docs.chain.link/data-feeds/price-feeds/addresses
  //contract example: https://etherscan.io/address/0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c#readContract
  public async getWETHPriceTokensFromChailink(
    tokenAddress: string,
  ): Promise<number> {
    let response = 0;
    try {
      const walletEther = new ethers.Wallet(this.viewPrivateKey);
      const connectedWallet = walletEther.connect(this.web3ProviderEthereum);
      const newcontract = new ethers.Contract(
        tokenAddress,
        chainlinkPriceFeedABI,
        this.web3ProviderEthereum,
      );
      const contractSigner = await newcontract.connect(connectedWallet);
      //getting price
      const value = await contractSigner.latestRoundData();

      //getting chainlink contract decimals (not always the same as the token we are querying)
      const decimals = await contractSigner.decimals();
      const price = Number(value[1]) / 10 ** Number(decimals);

      console.log('the price');
      console.log(price);
      response = price;
    } catch (err) {
      console.log('error api chailink price');
      console.log(err);
    }
    return response;
  }
}
