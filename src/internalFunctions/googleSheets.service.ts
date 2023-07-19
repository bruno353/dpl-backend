import { Injectable } from '@nestjs/common';

import { join } from 'path';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import { google } from 'googleapis';

import { PrismaService } from '../database/prisma.service';
import * as gdoctableapp from 'gdoctableapp';
import { LogService } from '../internalFunctions/log.service';

import axios from 'axios';

@Injectable()
export class GoogleSheetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
  ) {}

  //**FUNÇÕES */
  async getAuthSheets() {
    const credentialsPath = join(
      __dirname,
      '../internalFunctions/credentials.json',
    );
    const auth: any = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });
    const client: any = await auth.getClient();

    const googleSheets: any = google.sheets({
      version: 'v4',
      auth: client,
    });

    return {
      auth,
      client,
      googleSheets,
    };
  }

  //Função que faz um check para ver se a startup já possui uma sheet criada para ele no google drive, se não possuir, cria uma para ela.
  async checkGoogleDriveStartupSheet(usuarioId: string) {
    const usuarioExiste = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
      },
    });
    if (!usuarioExiste) {
      return;
    }

    const credentialsPath = join(
      __dirname,
      '../internalFunctions/credentials.json',
    );
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: 'https://www.googleapis.com/auth/drive',
    });
    const authClient = await auth.getClient();
    const driveService = google.drive({ version: 'v3', auth: authClient });
    const folderId = '1WOO0ir6VSzBcf6l2uUe5VBihxoJMBF0Y';

    //checando se já existe sheet da startup:
    try {
      const response = await driveService.files.list({
        q: `'${folderId}' in parents and trashed = false and name = '${usuarioExiste.nomeEmpresa}-${usuarioExiste.id}'`,
        fields: 'nextPageToken, files(id, name, mimeType)',
      });

      console.log(usuarioExiste.id);
      const files = response.data.files;
      if (files.length > 0) {
        console.log('Startup já possui uma sheets');
        return files[0].id; //retorna o id da sheet
      } else {
        console.log('Startup não possui um sheets, criando um');

        const fileMetadata = {
          name: `${usuarioExiste.nomeEmpresa}-${usuarioExiste.id}`,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          parents: [folderId],
        };

        try {
          const res = await driveService.files.create({
            requestBody: fileMetadata,
            fields: 'id',
          });
          console.log(res.data.id);
          return res; //retorna o id da sheet
        } catch (err) {
          console.log(
            'Erro - criação de sheets - checkGoogleDriveStartupSheet',
          );
          console.log(err);
        }
      }
    } catch (err) {
      console.log('Erro - checkGoogleDriveStartupSheet');
      console.log(err);
    }
  }

  //Esta função serve para criar uma tabela em uma sheet de startup (tabela financeira - omie, vindi, netsuite, conta azul, pluggy...)
  //Deve ser passado os dados que serão sub-escrevidos (data) bem como o nome da tabela desejada(type) e o id da startup(usuarioId).
  async writeSheet(usuarioId: string, data: any, type: string) {
    const spreadsheetId = await this.checkGoogleDriveStartupSheet(usuarioId);
    if (!spreadsheetId) {
      console.log('Algum erro ocorreu - writeSheet');
      console.log(usuarioId);
    }
    console.log(data);
    const { googleSheets, auth } = await this.getAuthSheets();

    try {
      //verifico se existe uma planilha para este user (se não existir retorna um erro e eu crio esse planilha):
      console.log('escrevendo dados na sheets');
      await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: `${type}`,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      });
      await googleSheets.spreadsheets.values.clear({
        auth,
        spreadsheetId,
        range: `${type}!A1:ZZ`,
      });
      await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: `${type}!A1:ZZ`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: data,
        },
      });
    } catch (err) {
      console.log('deu errrooo');
      console.log(err);
      if (
        err.response.data.error.message === `Unable to parse range: ${type}`
      ) {
        const resource = {
          requests: [
            {
              addSheet: {
                properties: {
                  title: `${type}`,
                },
              },
            },
          ],
        };
        await googleSheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource,
        });
        await googleSheets.spreadsheets.values.append({
          auth,
          spreadsheetId,
          range: `${type}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: data,
          },
        });
      } else {
        this.logService.createErrorLog(
          'writeSheet',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(data),
          undefined,
          usuarioId,
        );
        console.log(err);
      }
    }
  }

  //Esta função serve para escrever na sheet 'usuarios-startups' os usuários cadastrados na plataforma.
  async writeSheetUsuariosStartups() {
    const spreadsheetId = '10_CMlKGscsanR3lLfEJWYfmaN4UvmaBkzHmJaLcbivM';

    const { googleSheets, auth } = await this.getAuthSheets();

    //pegando os dados dos usuários:
    const finalValuesArray = [];
    const users = await this.prisma.usuario.findMany({});
    for (const user of users) {
      const value = [
        user.id,
        user.email,
        user.cnpj,
        user.country,
        user.nomeEmpresa,
        user.tipoNegocio,
        user.sobre,
        user.arr,
        user.runway,
        user.atualizadoEm,
        user.criadoEm,
      ];
      finalValuesArray.push(value);
    }
    const arrayHeaders = [
      'StartupId',
      'Email',
      'CNPJ',
      'Estado',
      'Nome da empresa',
      'Tipo de negócio',
      'Como ouvir falar da gente',
      'ARR',
      'RUNWAY',
      'AtualizadoEm',
      'CriadoEm',
    ];
    finalValuesArray.unshift(arrayHeaders);
    try {
      //verifico se existe uma planilha de usuarios:
      console.log('escrevendo dados na sheets');
      await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'usuarios',
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      });
      await googleSheets.spreadsheets.values.clear({
        auth,
        spreadsheetId,
        range: `usuarios!A1:ZZ`,
      });
      await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: `usuarios!A1:ZZ`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: finalValuesArray,
        },
      });
    } catch (err) {
      console.log('deu errrooo');
      console.log(err);
      if (
        err.response.data.error.message === `Unable to parse range: usuarios`
      ) {
        const resource = {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'usuarios',
                },
              },
            },
          ],
        };
        await googleSheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource,
        });
        await googleSheets.spreadsheets.values.append({
          auth,
          spreadsheetId,
          range: 'usuarios',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: finalValuesArray,
          },
        });
      } else {
        this.logService.createErrorLog(
          'writeSheetUsuariosStartups',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(finalValuesArray),
          undefined,
          undefined,
        );
        console.log(err);
      }
    }
  }

  //função para criar um novo documento no folder de KYB das startups:
  async createDocStartup(finalObj, name) {
    const credentialsPath = join(
      __dirname,
      '../internalFunctions/credentials.json',
    );
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
      ],
    });
    const authClient = await auth.getClient();
    const driveService = google.drive({ version: 'v3', auth: authClient });
    const docsService = google.docs({ version: 'v1', auth: authClient });
    const folderId = '1gsh3WxSYfj0qs68NPVx7UeWE_wxrrUCC';

    //checando se já existe sheet da startup
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId],
    };

    //pegando os dados e deixando em um array de arrays:
    const finalArray = [];
    for (const key in finalObj) {
      if (finalObj[key] === false) {
        finalObj[key] = 'Não';
      } else if (finalObj[key] === true) {
        finalObj[key] = 'Sim';
      } else if (!finalObj[key]) {
        finalObj[key] = '-';
      } else if (JSON.stringify(finalObj[key]) === '[]') {
        finalObj[key] = '-';
      } else if (typeof finalObj[key] !== 'string') {
        finalObj[key] = JSON.stringify(finalObj[key]);
      }
      finalArray.push([key, finalObj[key]]);
    }

    try {
      const res = await driveService.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });

      // await docsService.documents.batchUpdate({
      //   documentId: res.data.id,
      //   requestBody: {
      //     requests: [
      //       {
      //         insertTable: {
      //           location: {
      //             index: 1,
      //           },
      //           rows: 3,
      //           columns: 2,
      //         },
      //       },
      //       { insertText: { text: 'B2', location: { index: 12 } } },
      //       { insertText: { text: 'A2', location: { index: 10 } } },
      //       { insertText: { text: 'B1', location: { index: 7 } } },
      //       { insertText: { text: 'A1', location: { index: 5 } } },
      //     ],
      //   },
      // });

      console.log(res.data.id);
      const resource = {
        auth: authClient,
        documentId: res.data.id,
        rows: 22,
        columns: 2,
        createIndex: 1,
        // append: true, // When this is used instead of "Index", new table is created to the end of Document.
        values: finalArray,
      };
      gdoctableapp.CreateTable(resource, function (err, res) {
        if (err) {
          console.log(err);
          return;
        }
        console.log(res); // You can see the retrieved responses from Docs API.
      });
      //tratando o json para botar ele em uma tabela no google
    } catch (err) {
      this.logService.createErrorLog(
        'createDocStartup',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(fileMetadata),
        'Erro - criação de docs - createDocStartup',
        undefined,
      );
      console.log(err);
    }
  }

  //função para criar um novo documento no folder de KYB das startups de maneira dinâmica (não setando uma quantidade fixa de rows):
  async createDocStartupDynamic(finalObj, name, numKeys: number) {
    const credentialsPath = join(
      __dirname,
      '../internalFunctions/credentials.json',
    );
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
      ],
    });
    const authClient = await auth.getClient();
    const driveService = google.drive({ version: 'v3', auth: authClient });
    const docsService = google.docs({ version: 'v1', auth: authClient });
    const folderId = '1gsh3WxSYfj0qs68NPVx7UeWE_wxrrUCC';

    //checando se já existe sheet da startup
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId],
    };

    //pegando os dados e deixando em um array de arrays:
    const finalArray = [];
    for (const key in finalObj) {
      if (finalObj[key] === false) {
        finalObj[key] = 'Não';
      } else if (finalObj[key] === true) {
        finalObj[key] = 'Sim';
      } else if (!finalObj[key]) {
        finalObj[key] = '-';
      } else if (JSON.stringify(finalObj[key]) === '[]') {
        finalObj[key] = '-';
      } else if (typeof finalObj[key] !== 'string') {
        finalObj[key] = JSON.stringify(finalObj[key]);
      }
      finalArray.push([key, finalObj[key]]);
    }

    try {
      const res = await driveService.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });

      // await docsService.documents.batchUpdate({
      //   documentId: res.data.id,
      //   requestBody: {
      //     requests: [
      //       {
      //         insertTable: {
      //           location: {
      //             index: 1,
      //           },
      //           rows: 3,
      //           columns: 2,
      //         },
      //       },
      //       { insertText: { text: 'B2', location: { index: 12 } } },
      //       { insertText: { text: 'A2', location: { index: 10 } } },
      //       { insertText: { text: 'B1', location: { index: 7 } } },
      //       { insertText: { text: 'A1', location: { index: 5 } } },
      //     ],
      //   },
      // });

      console.log(res.data.id);
      const resource = {
        auth: authClient,
        documentId: res.data.id,
        rows: numKeys,
        columns: 2,
        createIndex: 1,
        // append: true, // When this is used instead of "Index", new table is created to the end of Document.
        values: finalArray,
      };
      gdoctableapp.CreateTable(resource, function (err, res) {
        if (err) {
          console.log(err);
          return;
        }
        console.log(res); // You can see the retrieved responses from Docs API.
      });
      //tratando o json para botar ele em uma tabela no google
    } catch (err) {
      this.logService.createErrorLog(
        'createDocStartup',
        JSON.stringify(err),
        JSON.stringify(err['response']['data']),
        JSON.stringify(fileMetadata),
        'Erro - criação de docs - createDocStartup',
        undefined,
      );
      console.log(err);
    }
  }

  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
