import { spawn } from 'child_process';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TestingService {
  constructor(private readonly prisma: PrismaService) {}

  createWallet(identity: string, passphrase: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const dfx = spawn('dfx', ['identity', 'new', identity]);
      let isPassphraseEntered = false;

      dfx.stdout.on('data', (data) => {
        const strData = data.toString();
        console.log(strData); // Log para debug, remover ou tratar em produção.
        // Verificar se o prompt de passphrase apareceu.
        if (
          strData.toLowerCase().includes('passphrase') &&
          !isPassphraseEntered
        ) {
          console.log('possuiiisisis');
          return;
          // Enviar a passphrase uma vez.
          dfx.stdin.write('ewee');
          dfx.stdin.end(); // Fechar o stdin após enviar a passphrase.
          isPassphraseEntered = true;
        }
      });

      dfx.stderr.on('data', (data) => {
        const strData = data.toString();
        console.error(strData); // Log para debug, remover ou tratar em produção.
      });

      dfx.on('close', (code) => {
        if (code === 0) {
          resolve('Wallet criada com sucesso.');
        } else {
          reject(new Error('Erro ao criar wallet.'));
        }
      });

      dfx.on('error', (error) => {
        reject(new Error(`Erro ao criar wallet: ${error.message}`));
      });
    });
  }
}
