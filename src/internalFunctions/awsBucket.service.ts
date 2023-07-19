import { BadRequestException, Injectable } from '@nestjs/common';

import { join } from 'path';

import Decimal from 'decimal.js';
Decimal.set({ precision: 60 });

import { google } from 'googleapis';
import { Storage } from '@google-cloud/storage';
import * as AWS from 'aws-sdk';
import { PrismaService } from '../database/prisma.service';

import axios from 'axios';

@Injectable()
export class AWSBucketService {
  constructor(private readonly prisma: PrismaService) {}

  //Ambiente googleCloud:
  AWS_S3_BUCKET = 'scalable-financial-files';
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_KEY_SECRET,
  });

  //Upload de alguma string do bucket do aws
  async uploadStringBucket(fileName: string, content: string) {
    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: fileName,
      Body: content,
      ContentType: 'text/plain', // Defina o tipo de conteúdo adequado para sua string
      ContentDisposition: 'inline',
    };

    try {
      const s3Response = await this.s3.upload(params).promise();
      console.log(s3Response);
      return s3Response;
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Upload error', {
        cause: new Error(),
        description: 'Upload error',
      });
    }
  }

  //Upload de algum arquivo do bucket do aws
  async uploadFileBucket(fileName: string, file: Express.Multer.File) {
    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      //   ACL: 'public-read',
      ContentType: file.mimetype,
      //   ACL: 'public-read',
      ContentDisposition: 'inline',
      //   CreateBucketConfiguration: {
      //     LocationConstraint: 'ap-south-1',
      //   },
    };

    console.log(params);

    try {
      const s3Response = await this.s3.upload(params).promise();

      console.log(s3Response);
      return s3Response;
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Upload error', {
        cause: new Error(),
        description: 'Upload error',
      });
    }
  }
  async deleteFileBucket(fileName: string) {
    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: fileName,
    };

    try {
      const s3Response = await this.s3.deleteObject(params).promise();
      console.log(s3Response);
      return s3Response;
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Delete error', {
        cause: new Error(),
        description: 'Delete error',
      });
    }
  }

  async getFileBuffer(fileName: string): Promise<Buffer> {
    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: fileName,
    };

    try {
      const s3Response = await this.s3.getObject(params).promise();
      console.log(s3Response);
      // O Buffer do arquivo pode ser acessado através de s3Response.Body
      if (s3Response.Body instanceof Buffer) {
        return s3Response.Body;
      } else {
        throw new BadRequestException('File content is not a Buffer', {
          description: 'File content is not a Buffer',
        });
      }
    } catch (e) {
      console.log(e);
      throw new BadRequestException('File retrieval error', {
        cause: new Error(),
        description: 'File retrieval error',
      });
    }
  }

  async verifyIfFileExists(fileName: string): Promise<boolean> {
    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: fileName,
    };

    try {
      const s3Response = await this.s3.getObject(params).promise();
      console.log(s3Response);
      // O Buffer do arquivo pode ser acessado através de s3Response.Body
      if (s3Response.Body instanceof Buffer) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
