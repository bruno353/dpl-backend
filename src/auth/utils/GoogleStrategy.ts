import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
//Dependencia utilizada para realizar o login auth2.0 do google
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.CLIENT_ID_GOOGLE_CLOUD_OAUTH,
      clientSecret: process.env.CLIENT_SECRET_GOOGLE_CLOUD_OAUTH,
      callbackURL: process.env.CALLBACK_URL_GOOGLE_CLOUD_OAUTH,
      scope: ['profile', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    // console.log(accessToken);
    // console.log(refreshToken);
    console.log('realizando estrategia login google');
    console.log(profile);
    if (!profile.emails[0].verified) {
      throw new BadRequestException('Google 2.0 Error', {
        cause: new Error(),
        description: 'Google 2.0 Error',
      });
    }
    return await this.authService.loginGoogle(profile.emails[0].value);
    // const user = await this.authService.validateUser({
    //   email: profile.emails[0].value,
    //   displayName: profile.displayName,
    // });
    // console.log('Validate');
    // console.log(user);
    // return user || null;
  }
}
