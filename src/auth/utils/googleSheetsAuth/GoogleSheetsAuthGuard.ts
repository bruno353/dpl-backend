import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
//Dependencia utilizada para realizar o login auth2.0 do google
@Injectable()
export class GoogleSheetsAuthGuard extends AuthGuard('google-sheets') {
  async canActivate(context: ExecutionContext) {
    console.log('request Google Sheets AuthGuard');
    const activate = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();
    console.log(request.user);
    return request.user;
  }
}
