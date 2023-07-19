import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ethers } from 'ethers';
import { SimpleCrypto } from 'simple-crypto-js';
import { join } from 'path';
import { Storage } from '@google-cloud/storage';
import { v4 as uuid } from 'uuid';
import { format, addMonths, addDays, endOfMonth, parse } from 'date-fns';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import { PrismaService } from '../database/prisma.service';

import { Request, response } from 'express';
import axios from 'axios';
import { GoogleBucketService } from 'src/internalFunctions/googleBucket.service';
import { EmailSenderService } from '../internalFunctions/emailSender.service';
import { AuthService } from 'src/auth/auth.service';
import { LogService } from '../internalFunctions/log.service';

import escritor from './escritor';
import layouts from './layout';
import { CreateCNABDTO, CreateCNABDTOArray } from './dto/create-cnab.dto';

@Injectable()
export class CNABManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly logService: LogService,
  ) {}
  simpleCryptoJs = new SimpleCrypto(process.env.CIPHER);

  clientIdSRMAPI = process.env.CLIENT_ID_SRM_API;
  passwordSRMAPI = process.env.PASSWORD_SRM_API;
  urlSRMAPI = process.env.URL_SRM_API;

  //**ENDPOINTS:**
  //Service para criação e gerenciamento de CNABS 400 - Bradesco -> https://github.com/marcodpt/cnab/blob/main/manual/livro/remessa_cobranca.md.

  //Devolve arquivo cnab.rem
  async create(data: CreateCNABDTOArray, req: Request) {
    const accessToken = String(req.headers['x-parse-session-token']);
    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isAdmin)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only admin can do this',
      });

    if (data.cnabs.length === 0) {
      throw new BadRequestException('Cnab is empty', {
        cause: new Error(),
        description: 'Cnab is empty',
      });
    }
    const currentDate = new Date();
    console.log(`data de hoje: ` + currentDate);
    //procurando quantos cnabs foram criados hoje, isso será o contador usado na 'sequencia';
    // Obtém o início do dia atual
    const startOfDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
    );

    // Obtém o término do dia atual (início do próximo dia)
    const endOfDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1,
    );

    const cnabsToday = await this.prisma.cNABData.findMany({
      where: {
        criadoEm: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const finalData = {
      tipo: 'remessa_cobranca',
      nome: 'SRM',
      geracao: format(currentDate, 'yyyy-MM-dd'),
      banco: 'bradesco',
      codigo: '00000000000004802747',
      agencia: 3391,
      conta: 3277,
      carteira: '09',
      contrato: '',
      sequencia: cnabsToday.length + 1,
      registros: [],
    };

    let cont = 1; //contador para numerar os registros
    await data.cnabs.map(async (i) => {
      //validando cpfcnpj
      const cnpjcpfValido = await this.validarCNPJCPF(i.cnpjcpf);
      if (!cnpjcpfValido) {
        throw new BadRequestException('Invalid CNPJ/CPF', {
          cause: new Error(),
          description: 'Invalid CNPJ/CPF',
        });
      }
      i.cnpjcpf = cnpjcpfValido;

      //fazendo looping em cada garantia, para assim registrar todas as parcelas informadas das duplicatas:
      for (let k = 0; k < i.quantidadeDuplicatas; k++) {
        // Cria um novo objeto Date a partir da string vencimentoPrimeiraDuplicata
        const firstDateOfMonth = parse(
          `${i.vencimentoPrimeiraDuplicata}-01`,
          'yyyy-MM-dd',
          new Date(),
        );
        const registro = {
          nome: i.nome,
          cnpjcpf: i.cnpjcpf,
          operacao: 'Entrada',
          documento: String(cont),
          emissao: format(currentDate, 'yyyy-MM-dd'),
          // Adiciona 'k' meses à data inicial e então ajusta a data para o último dia do mês resultante
          vencimento: format(
            endOfMonth(addMonths(firstDateOfMonth, k)),
            'yyyy-MM-dd',
          ),
          valor: i.valor,
          abatimento: 0,
          juros: 0,
          cep: i.cep,
          endereco: i.endereco,
        };
        console.log(cont);
        finalData.registros.push(registro);
        cont += 1;
      }
    });

    const cnabData = escritor(
      finalData,
      layouts['remessa_cobranca']['bradesco'],
    );

    const day = currentDate.getDate(); // retorna o dia do mês de 1 a 31
    const month = currentDate.getMonth() + 1; // retorna o mês do ano de 1 a 12
    const randomAlphaNumeric = await this.generateRandomAlphaNumeric(2);
    const fileName = `CB${day}${month}${randomAlphaNumeric}.rem`;

    const buffer = Buffer.from(cnabData, 'utf-8');

    //retorna o nome do arquivo e seu buffer:
    const finalReturn = { nome: fileName, buffer };

    //armazenando na base;
    await this.prisma.cNABData.create({
      data: {
        data: JSON.stringify(finalData),
      },
    });
    return finalReturn;
  }

  async formatDateLocal(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async generateRandomAlphaNumeric(length) {
    return [...Array(length)]
      .map(() => Math.random().toString(36)[2].toUpperCase())
      .join('');
  }

  async validarCNPJCPF(cnpjcpf: string) {
    // Remove caracteres não numéricos
    cnpjcpf = cnpjcpf.replace(/[^\d]+/g, '');

    // Verifica se possui 11 ou 14 caracteres numéricos
    if (cnpjcpf.length !== 11 && cnpjcpf.length !== 14) {
      return false;
    }

    // Verifica se todos os caracteres são iguais (ex: 00000000000 ou 00000000000000)
    if (/^(\d)\1+$/.test(cnpjcpf)) {
      return false;
    }

    if (cnpjcpf.length === 11) {
      // Validação para CPF

      // Verifica a validade do dígito verificador
      let soma = 0;
      let peso = 10;
      for (let i = 0; i < 9; i++) {
        soma += parseInt(cnpjcpf.charAt(i)) * peso;
        peso--;
      }
      const dv1 = 11 - (soma % 11);
      if (dv1 > 9) {
        if (cnpjcpf.charAt(9) !== '0') {
          return false;
        }
      } else {
        if (cnpjcpf.charAt(9) !== dv1.toString()) {
          return false;
        }
      }

      soma = 0;
      peso = 11;
      for (let i = 0; i < 10; i++) {
        soma += parseInt(cnpjcpf.charAt(i)) * peso;
        peso--;
      }
      const dv2 = 11 - (soma % 11);
      if (dv2 > 9) {
        if (cnpjcpf.charAt(10) !== '0') {
          return false;
        }
      } else {
        if (cnpjcpf.charAt(10) !== dv2.toString()) {
          return false;
        }
      }
    } else {
      // Validação para CNPJ

      // Verifica a validade do primeiro dígito verificador
      let soma = 0;
      let peso = 2;
      for (let i = 11; i >= 0; i--) {
        soma += parseInt(cnpjcpf.charAt(i)) * peso;
        peso = (peso + 1) % 10 || 2;
      }
      const dv1 = 11 - (soma % 11);
      if (dv1 > 9) {
        if (cnpjcpf.charAt(12) !== '0') {
          return false;
        }
      } else {
        if (cnpjcpf.charAt(12) !== dv1.toString()) {
          return false;
        }
      }

      // Verifica a validade do segundo dígito verificador
      soma = 0;
      peso = 2;
      for (let i = 12; i >= 0; i--) {
        soma += parseInt(cnpjcpf.charAt(i)) * peso;
        peso = (peso + 1) % 10 || 2;
      }
      const dv2 = 11 - (soma % 11);
      if (dv2 > 9) {
        if (cnpjcpf.charAt(13) !== '0') {
          return false;
        }
      } else {
        if (cnpjcpf.charAt(13) !== dv2.toString()) {
          return false;
        }
      }
    }

    return cnpjcpf;
  }

  async getFormattedDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }
}
