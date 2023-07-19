import { Injectable } from '@nestjs/common';

import { join } from 'path';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import { google } from 'googleapis';
import { Storage } from '@google-cloud/storage';

import { PrismaService } from '../database/prisma.service';

import axios from 'axios';

@Injectable()
export class GoogleBucketService {
  constructor(private readonly prisma: PrismaService) {}

  //Ambiente googleCloud:
  projectId = process.env.PROJECT_ID_GOOGLE_CLOUD_BUCKET;
  keyFilename = join(__dirname, '../internalFunctions/credentialsBucket.json');

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

  //Upload de algum arquivo do bucket do google cloud
  async uploadFileBucket(fileName: string, file: Express.Multer.File) {
    const projectId = this.projectId;
    const keyFilename = this.keyFilename;

    const storage = new Storage({ projectId, keyFilename });
    const bucket = storage.bucket('storage-files-scalable');

    const blob = bucket.file(fileName);
    const blobStream = await blob.createWriteStream();
    await blobStream.end(file.buffer);
  }

  //Deletar algum arquivo do bucket do google cloud
  async deleteFileBucket(fileName: string) {
    const projectId = this.projectId;
    const keyFilename = this.keyFilename;

    const storage = new Storage({ projectId, keyFilename });
    const bucket = storage.bucket('storage-files-scalable');
    const blob = bucket.file(fileName);
    await blob.delete();
  }

  async getBucketName() {
    const projectId = this.projectId;
    const keyFilename = this.keyFilename;

    const storage = new Storage({ projectId, keyFilename });
    const bucket = storage.bucket('storage-files-scalable');
    return bucket.name;
  }

  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
