import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../../auth.service';
import { google, Auth } from 'googleapis';
import axios from 'axios';

@Injectable()
export class GoogleSheetsStrategy extends PassportStrategy(
  Strategy,
  'google-sheets',
) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.CLIENT_ID_GOOGLE_CLOUD_OAUTH_SHEETS,
      clientSecret: process.env.CLIENT_SECRET_GOOGLE_CLOUD_OAUTH_SHEETS,
      callbackURL: process.env.CALLBACK_URL_GOOGLE_CLOUD_OAUTH_SHEETS,
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
      ],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    // console.log(profile);
    console.log('realizando estrategia sheets google');
    if (!profile.emails[0].verified) {
      console.log('conexão não sucedida');
      throw new BadRequestException('Google 2.0 Error', {
        cause: new Error(),
        description: 'Google 2.0 Error',
      });
    }
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
    );
    const scopes = response.data.scope.split(' ');
    if (
      !scopes.includes(
        'https://www.googleapis.com/auth/spreadsheets.readonly',
      ) ||
      !scopes.includes(
        'https://www.googleapis.com/auth/drive.metadata.readonly',
      )
    ) {
      console.log('o usuario nao concedeu acessos suficientes');
      throw new BadRequestException('Acesso Negado', {
        cause: new Error(),
        description: 'Usuário não concedeu permissões suficientes',
      });
    }
    console.log('o usuário auth com sucesso:');
    console.log(profile);
    // List all Google Sheets files
    //preparando para retornar à chamada a lista com as 100 primeiras (mais atualizadas) planilhas do usuário e o token de auth que é necessário para se ter acesso a elas.
    const sheetsDoUsuarios = {};
    console.log('realizando leitura sheets');
    sheetsDoUsuarios['files'] = await this.listFiles(accessToken);
    sheetsDoUsuarios['oAuthToken'] = accessToken;
    console.log('retorno final');
    console.log(sheetsDoUsuarios);
    return sheetsDoUsuarios;
  }

  async listFiles(authToken: string) {
    console.log('vou fazer a listagem');

    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({ access_token: authToken });

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    const res = await drive.files.list({
      pageSize: 100,
      fields: 'nextPageToken, files(id, name)',
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
    });

    return res.data.files;
    // console.log('pegando a primeira planilha');
    // console.log(res.data.files[0]);
    // await this.getSheetData(authToken, res.data.files[0].id);
  }
}
