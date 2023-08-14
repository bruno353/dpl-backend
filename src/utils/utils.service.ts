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

  //example of dataBody: {﻿created_at: '2023-08-14T16:37:00.000000Z',﻿created_by: 'https://api.calendly.com/users/bb4efcfa-56d4-4751-acfd-644af5f372d7';,﻿event: 'invitee.created',﻿payload: {﻿cancel_url: 'https://calendly.com/cancellations/30429fd6-dcc5-4b15-aa65-d9f658df7c21';,﻿created_at: '2023-08-14T16:37:00.264437Z',﻿email: 'brunolsantos152@gmail.com',﻿event: 'https://api.calendly.com/scheduled_events/aa3f7446-d8b6-422c-8414-cada16e33158';,﻿first_name: null,﻿last_name: null,﻿name: 'BRUNO LAUREANO DOS SANTOS',﻿new_invitee: null,﻿no_show: null,﻿old_invitee: null,﻿payment: null,﻿questions_and_answers: [ [Object] ],﻿reconfirmation: null,﻿reschedule_url: 'https://calendly.com/reschedulings/30429fd6-dcc5-4b15-aa65-d9f658df7c21';,﻿rescheduled: false,﻿routing_form_submission: null,﻿scheduled_event: {﻿created_at: '2023-08-14T16:37:00.249519Z',﻿end_time: '2023-08-30T14:00:00.000000Z',﻿event_guests: [],﻿event_memberships: [Array],﻿event_type: 'https://api.calendly.com/event_types/e153a182-7013-4e45-8ddc-430089ba3381';,﻿invitees_counter: [Object],﻿location: [Object],﻿name: 'Test event type',﻿start_time: '2023-08-30T13:30:00.000000Z',﻿status: 'active',﻿updated_at: '2023-08-14T16:37:00.249519Z',﻿uri: 'https://api.calendly.com/scheduled_events/aa3f7446-d8b6-422c-8414-cada16e33158';﻿},﻿status: 'active',﻿text_reminder_number: null,﻿timezone: 'America/Sao_Paulo',﻿tracking: {﻿utm_campaign: null,﻿utm_source: null,﻿utm_medium: null,﻿utm_content: null,﻿utm_term: null,﻿salesforce_uuid: null﻿},﻿updated_at: '2023-08-14T16:37:00.264437Z',﻿uri: 'https://api.calendly.com/scheduled_events/aa3f7446-d8b6-422c-8414-cada16e33158/invitees/30429fd6-dcc5-4b15-aa65-d9f658df7c21';﻿}﻿}
  async calendlyWebhook(dataBody: any, req: Request) {
    console.log('chamado');
    console.log(dataBody);
    const keySignature = String(req.headers['calendly-webhook-signature']);

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

    const data = t + '.' + JSON.stringify(req.body);

    const expectedSignature = createHmac('sha256', this.webhookSigningKey)
      .update(data, 'utf8')
      .digest('hex');

    // Determine the expected signature by computing an HMAC with the SHA256 hash function.

    if (expectedSignature !== signature) {
      // Signature is invalid!
      console.log('invalid signature');
      throw new Error('Invalid Signature');
    }

    //checking to see if the event already exists:
    const eventExists =
      await this.prisma.speakersRegistrationCalendly.findFirst({
        where: {
          uri: dataBody['payload']['uri'],
        },
      });
    console.log('event exists?');
    console.log(eventExists);
    if (eventExists) {
      if (dataBody['event'] === 'invitee.created') {
        console.log('event already created');
        //the event already exists, does need to be created again
        return;
      } else if (dataBody['event'] !== 'invitee.created') {
        if (dataBody['payload']['rescheduled'] === true) {
          console.log('rescheduled');
          await this.prisma.speakersRegistrationCalendly.updateMany({
            where: {
              uri: dataBody['payload']['uri'],
            },
            data: {
              reschedule: true,
              active: false,
            },
          });
        } else {
          console.log('canceled');
          await this.prisma.speakersRegistrationCalendly.updateMany({
            where: {
              uri: dataBody['payload']['uri'],
            },
            data: {
              active: false,
            },
          });
        }
      }
    } else {
      console.log('new event');
      console.log(dataBody['payload']['questions_and_answers']);
      console.log('the start time');
      console.log(dataBody['payload']['start_time']);
      console.log(new Date(dataBody['payload']['start_time']));
      await this.prisma.speakersRegistrationCalendly.create({
        data: {
          uri: dataBody['payload']['uri'],
          userName: dataBody['payload']['name'],
          userEmail: dataBody['payload']['email'],
          eventAt: new Date(dataBody['payload']['start_time']),
          additionalInfo: JSON.stringify(
            dataBody['payload']['questions_and_answers'],
          ),
        },
      });
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
