import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { extname } from 'path';

import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import * as multer from 'multer';

import { CreditService } from './credit.service';

import { validate } from 'class-validator';

@ApiTags('Credit - Endpoints')
@Controller('functions')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}
  apiTokenKey = process.env.API_TOKEN_KEY;
  scalableSignature = process.env.SCALABLE_SIGNATURE;

  @Post('/ocrFilesSummary')
  @UseInterceptors(AnyFilesInterceptor())
  async ocrFilesSummary(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    // if (files.length > 3) {
    //   throw new BadRequestException('Upload exceeds 3 files', {
    //     cause: new Error(),
    //     description: 'Upload exceeds 3 files',
    //   });
    // }
    // const maxFileSize = 5 * 1024 * 1024; // 5 MB
    // const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    // const promises = files.map(async (file) => {
    //   const validationErrors = await validate(file, {
    //     validationError: { target: false },
    //   });
    //   if (validationErrors.length > 0) {
    //     throw new BadRequestException(validationErrors);
    //   }
    //   if (file.size > maxFileSize) {
    //     throw new BadRequestException(
    //       `File ${file.originalname} is too large, maximum allowed size is ${
    //         maxFileSize / 1024 / 1024
    //       } MB`,
    //     );
    //   }
    //   // const fileExtension = extname(file.originalname).substring(1);
    //   // if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
    //   //   throw new BadRequestException(
    //   //     'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf',
    //   //   );
    //   // }
    // });

    // await Promise.all(promises);
    return this.creditService.ocrFilesSummary(files);
  }

  @Post('/ocrFilesFinancialIndex')
  @UseInterceptors(AnyFilesInterceptor())
  async ocrFilesFinancialIndex(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    // if (files.length > 3) {
    //   throw new BadRequestException('Upload exceeds 3 files', {
    //     cause: new Error(),
    //     description: 'Upload exceeds 3 files',
    //   });
    // }
    // const maxFileSize = 5 * 1024 * 1024; // 5 MB
    // const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    // const promises = files.map(async (file) => {
    //   const validationErrors = await validate(file, {
    //     validationError: { target: false },
    //   });
    //   if (validationErrors.length > 0) {
    //     throw new BadRequestException(validationErrors);
    //   }
    //   if (file.size > maxFileSize) {
    //     throw new BadRequestException(
    //       `File ${file.originalname} is too large, maximum allowed size is ${
    //         maxFileSize / 1024 / 1024
    //       } MB`,
    //     );
    //   }
    // const fileExtension = extname(file.originalname).substring(1);
    // if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
    //   throw new BadRequestException(
    //     'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf',
    //   );
    // }
    // });

    // await Promise.all(promises);
    return this.creditService.ocrFilesFinancialIndex(files);
  }

  @Post('/teste')
  @UseInterceptors(AnyFilesInterceptor())
  async myTest(
    @UploadedFiles() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    // if (files.length > 3) {
    //   throw new BadRequestException('Upload exceeds 3 files', {
    //     cause: new Error(),
    //     description: 'Upload exceeds 3 files',
    //   });
    // }
    // const maxFileSize = 5 * 1024 * 1024; // 5 MB
    // const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    // const promises = files.map(async (file) => {
    //   const validationErrors = await validate(file, {
    //     validationError: { target: false },
    //   });
    //   if (validationErrors.length > 0) {
    //     throw new BadRequestException(validationErrors);
    //   }
    //   if (file.size > maxFileSize) {
    //     throw new BadRequestException(
    //       `File ${file.originalname} is too large, maximum allowed size is ${
    //         maxFileSize / 1024 / 1024
    //       } MB`,
    //     );
    //   }
    //   // const fileExtension = extname(file.originalname).substring(1);
    //   // if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
    //   //   throw new BadRequestException(
    //   //     'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf',
    //   //   );
    //   // }
    // });

    // await Promise.all(promises);
    return this.creditService.myTest(file);
  }
  @Post('/teste2')
  @UseInterceptors(AnyFilesInterceptor())
  async myTest2(
    @UploadedFiles() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    // if (files.length > 3) {
    //   throw new BadRequestException('Upload exceeds 3 files', {
    //     cause: new Error(),
    //     description: 'Upload exceeds 3 files',
    //   });
    // }
    // const maxFileSize = 5 * 1024 * 1024; // 5 MB
    // const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    // const promises = files.map(async (file) => {
    //   const validationErrors = await validate(file, {
    //     validationError: { target: false },
    //   });
    //   if (validationErrors.length > 0) {
    //     throw new BadRequestException(validationErrors);
    //   }
    //   if (file.size > maxFileSize) {
    //     throw new BadRequestException(
    //       `File ${file.originalname} is too large, maximum allowed size is ${
    //         maxFileSize / 1024 / 1024
    //       } MB`,
    //     );
    //   }
    //   // const fileExtension = extname(file.originalname).substring(1);
    //   // if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
    //   //   throw new BadRequestException(
    //   //     'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf',
    //   //   );
    //   // }
    // });

    // await Promise.all(promises);
    return this.creditService.myTest2();
  }
  @Post('/testGoogle')
  @UseInterceptors(AnyFilesInterceptor())
  async testGoogle(
    @UploadedFiles() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    // if (files.length > 3) {
    //   throw new BadRequestException('Upload exceeds 3 files', {
    //     cause: new Error(),
    //     description: 'Upload exceeds 3 files',
    //   });
    // }
    // const maxFileSize = 5 * 1024 * 1024; // 5 MB
    // const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    // const promises = files.map(async (file) => {
    //   const validationErrors = await validate(file, {
    //     validationError: { target: false },
    //   });
    //   if (validationErrors.length > 0) {
    //     throw new BadRequestException(validationErrors);
    //   }
    //   if (file.size > maxFileSize) {
    //     throw new BadRequestException(
    //       `File ${file.originalname} is too large, maximum allowed size is ${
    //         maxFileSize / 1024 / 1024
    //       } MB`,
    //     );
    //   }
    //   // const fileExtension = extname(file.originalname).substring(1);
    //   // if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
    //   //   throw new BadRequestException(
    //   //     'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf',
    //   //   );
    //   // }
    // });

    // await Promise.all(promises);
    return this.creditService.testGoogle();
  }

  @Post('/myTestMultipleUploads')
  @UseInterceptors(AnyFilesInterceptor())
  async myTestMultipleUploads(
    @UploadedFiles() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    // if (files.length > 3) {
    //   throw new BadRequestException('Upload exceeds 3 files', {
    //     cause: new Error(),
    //     description: 'Upload exceeds 3 files',
    //   });
    // }
    // const maxFileSize = 5 * 1024 * 1024; // 5 MB
    // const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    // const promises = files.map(async (file) => {
    //   const validationErrors = await validate(file, {
    //     validationError: { target: false },
    //   });
    //   if (validationErrors.length > 0) {
    //     throw new BadRequestException(validationErrors);
    //   }
    //   if (file.size > maxFileSize) {
    //     throw new BadRequestException(
    //       `File ${file.originalname} is too large, maximum allowed size is ${
    //         maxFileSize / 1024 / 1024
    //       } MB`,
    //     );
    //   }
    //   // const fileExtension = extname(file.originalname).substring(1);
    //   // if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
    //   //   throw new BadRequestException(
    //   //     'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf',
    //   //   );
    //   // }
    // });

    // await Promise.all(promises);
    return this.creditService.myTestMultipleUploads();
  }

  @Post('/teste3')
  @UseInterceptors(AnyFilesInterceptor())
  async myTest3(
    @UploadedFiles() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    // if (files.length > 3) {
    //   throw new BadRequestException('Upload exceeds 3 files', {
    //     cause: new Error(),
    //     description: 'Upload exceeds 3 files',
    //   });
    // }
    // const maxFileSize = 5 * 1024 * 1024; // 5 MB
    // const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    // const promises = files.map(async (file) => {
    //   const validationErrors = await validate(file, {
    //     validationError: { target: false },
    //   });
    //   if (validationErrors.length > 0) {
    //     throw new BadRequestException(validationErrors);
    //   }
    //   if (file.size > maxFileSize) {
    //     throw new BadRequestException(
    //       `File ${file.originalname} is too large, maximum allowed size is ${
    //         maxFileSize / 1024 / 1024
    //       } MB`,
    //     );
    //   }
    //   // const fileExtension = extname(file.originalname).substring(1);
    //   // if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
    //   //   throw new BadRequestException(
    //   //     'File type not allowed. Allowed extensions: jpg, jpeg, png, pdf',
    //   //   );
    //   // }
    // });

    // await Promise.all(promises);
    return this.creditService.myTest3();
  }
  @Post('/uploadFilesAI')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFiles(
    @Body()
    data: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const apiToken = String(req.headers['x-parse-application-id']);
    if (apiToken !== this.apiTokenKey) throw new UnauthorizedException();
    if (files.length > 5) {
      throw new BadRequestException('Upload exceeds 5 files', {
        cause: new Error(),
        description: 'Upload exceeds 5 files',
      });
    }
    const maxFileSize = 5 * 1024 * 1024; // 5 MB
    const allowedExtensions = ['csv', 'xlxs'];
    const promises = files.map(async (file) => {
      const validationErrors = await validate(file, {
        validationError: { target: false },
      });
      if (validationErrors.length > 0) {
        throw new BadRequestException(validationErrors);
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} is too large, maximum allowed size is ${
            maxFileSize / 1024 / 1024
          } MB`,
        );
      }
      const fileExtension = extname(file.originalname).substring(1);
      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        throw new BadRequestException(
          'File type not allowed. Allowed extensions: csv, xlxs',
        );
      }
    });

    await Promise.all(promises);
    return this.creditService.uploadFiles(data, files, req);
  }
}
