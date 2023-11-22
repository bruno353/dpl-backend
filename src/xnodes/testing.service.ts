import { spawn } from 'child_process';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TestingService {
  constructor(private readonly prisma: PrismaService) {}

  createWallet(identity: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const output = { stdout: '', stderr: '' };
      const dfx = spawn('dfx', ['identity', 'new', identity]);

      dfx.stdout.on('data', (data) => {
        output.stdout += data.toString();
      });

      dfx.stderr.on('data', (data) => {
        output.stderr += data.toString();
      });

      dfx.on('close', (code) => {
        if (code === 0) {
          console.log('dfx command executed successfully:', output.stdout);
          resolve(output.stdout);
        } else {
          console.error('dfx command failed:', output.stderr);
          reject(new Error(`Erro ao criar wallet: ${output.stderr}`));
        }
      });

      dfx.on('error', (error) => {
        reject(new Error(`Erro ao criar wallet: ${error.message}`));
      });
    });
  }
}
