import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Express } from 'express';

@ValidatorConstraint({ name: 'maxFileSize', async: false })
export class MaxFileSizeValidator implements ValidatorConstraintInterface {
  constructor(private readonly maxSize: number) {}

  validate(file: Express.Multer.File): boolean {
    return file.size <= this.maxSize;
  }

  defaultMessage(args: ValidationArguments): string {
    return `File is too large, maximum allowed size is ${
      this.maxSize / 1024 / 1024
    } MB`;
  }
}
