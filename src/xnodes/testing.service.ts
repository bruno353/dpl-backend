import {
  ConflictException,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { exec } from 'child_process';
import { promisify } from 'util';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TestingService {
  constructor(private readonly prisma: PrismaService) {}
  private execPromise = promisify(exec);

  async createWallet(identity: string): Promise<string> {
    console.log('will start');
    console.log(`PATH: ${process.env.PATH}`);
    try {
      const { stdout, stderr } = await this.execPromise(
        `dfx identity ${identity}`,
      );
      if (stderr) {
        throw new Error(stderr);
      }
      console.log(stdout);
      return stdout;
    } catch (error) {
      throw new Error(`Erro ao criar wallet: ${error.message}`);
    }
  }
}
