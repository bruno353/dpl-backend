import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

@Injectable()
export class TestingService {
  private execPromise = promisify(exec);

  async createWallet(identity: string, passphrase: string): Promise<string> {
    try {
      const scriptPath = '/app/src/xnodes/create_wallet.sh'; // Caminho absoluto dentro do container
      const { stdout, stderr } = await this.execPromise(
        `sh ${scriptPath} ${identity} ${passphrase}`,
      );
      if (stderr) {
        throw new Error(stderr);
      }
      return stdout;
    } catch (error) {
      throw new Error(`Erro ao criar wallet: ${error.message}`);
    }
  }
}
