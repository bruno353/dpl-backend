import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

@Injectable()
export class TestingService {
  private execPromise = promisify(exec);

  async createWallet(identity: string, passphrase: string): Promise<string> {
    try {
      const scriptPath = './create_wallet.sh';
      const { stdout, stderr } = await this.execPromise(
        `${scriptPath} ${identity} ${passphrase}`,
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
