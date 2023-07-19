/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

import * as sgMail from '@sendgrid/mail';
import { SimpleCrypto } from 'simple-crypto-js';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import { PrismaService } from '../database/prisma.service';

import axios from 'axios';

@Injectable()
export class LogService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  simpleCryptoJs = new SimpleCrypto(process.env.CIPHER);
  
  async createErrorLog(nomeFuncao?: string, erro?: string, erroDescricao?: string, configChamadaAPI?: string, observacoes?: string, usuarioId?: string) {
    const log = await this.prisma.errosLogs.create({
        data: {
          nomeFuncao,
          erro,
          erroDescricao,
          configChamadaAPI,
          observacoes,
          usuarioId,
        },
      });
      return log;
  }
  
  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
