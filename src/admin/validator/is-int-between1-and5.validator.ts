import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsIntBetween1And5 implements ValidatorConstraintInterface {
  validate(grossMargin: string, args: ValidationArguments) {
    const value = parseInt(grossMargin, 10);
    return !isNaN(value) && value >= 1 && value <= 5;
  }

  defaultMessage(args: ValidationArguments) {
    return 'string deve ser um número inteiro entre 1 e 5';
  }
}
