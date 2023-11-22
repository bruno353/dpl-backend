import { Injectable } from '@nestjs/common';
import * as pty from 'node-pty';

@Injectable()
export class TestingService {
  async createWallet(identity: string, passphrase: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ptyProcess = pty.spawn('dfx', ['identity', 'new', identity], {
        name: 'xterm-color',
        cwd: process.cwd(), // Ou o diretório que você precisa
        env: process.env,
      });

      let output = '';

      ptyProcess.onData((data) => {
        console.log('entrei');
        output += data;
        console.log(output);
        console.log(data); // Para debug, você verá o que está acontecendo no terminal
        if (data.includes('passphrase')) {
          console.log('tem passphrase');
          ptyProcess.write(passphrase + '\r'); // '\r' é o retorno do carro, usado para simular a tecla "Enter"
        }
        // Aqui você pode verificar se há uma saída que indica sucesso e resolver a promessa
      });

      ptyProcess.onExit(({ exitCode }) => {
        if (exitCode === 0) {
          resolve(output);
        } else {
          reject(new Error(`Erro ao criar wallet: ${output}`));
        }
      });
    });
  }
}
