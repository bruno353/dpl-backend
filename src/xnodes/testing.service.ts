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

      let stdout = '';
      let stderr = '';

      dfx.stdout.on('data', (data) => {
        stdout += data.toString();
        // Quando o comando pede por uma passphrase, escreva-a no stdin do processo
        if (stdout.includes('Please enter a passphrase')) {
          console.log('tem passphrase');
          dfx.stdin.write(passphrase + '\n');
          // Se você quiser deixar em branco, apenas envie '\n'
          // dfx.stdin.write('\n');
        }
      });
      console.log('n tem passphrase');

      dfx.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      dfx.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Erro ao criar wallet: ${stderr}`));
        }
      });

      dfx.on('error', (error) => {
        reject(new Error(`Erro ao criar wallet: ${error.message}`));
      });
    });
  }
}
