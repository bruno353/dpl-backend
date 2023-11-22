import { spawn } from 'child_process';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TestingService {
  constructor(private readonly prisma: PrismaService) {}

  createWallet(identity: string, passphrase: string): Promise<string> {
    console.log('comecando');
    return new Promise((resolve, reject) => {
      const dfx = spawn('dfx', ['identity', 'new', identity]);
      let resolved = false;

      dfx.stdout.on('data', (data) => {
        const strData = data.toString();
        console.log(strData); // Remova isso em produção para evitar expor dados sensíveis.
        if (strData.includes('Please enter a passphrase')) {
          console.log('tem passphrase');
          dfx.stdin.write(passphrase + '\n');
        }
        if (strData.includes('algum indicador de sucesso')) {
          if (!resolved) {
            resolved = true;
            resolve(strData);
          }
        }
      });

      dfx.stderr.on('data', (data) => {
        console.error(data.toString()); // Remova isso em produção para evitar expor dados sensíveis.
      });

      dfx.on('close', (code) => {
        if (code === 0 && !resolved) {
          resolved = true;
          resolve('Wallet criada com sucesso.');
        } else if (!resolved) {
          reject(new Error('Erro ao criar wallet.'));
        }
      });

      dfx.on('error', (error) => {
        if (!resolved) {
          reject(new Error(`Erro ao criar wallet: ${error.message}`));
        }
      });
    });
  }
}
