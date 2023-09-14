import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// import { import_ } from '@brillout/import';
import * as sgMail from '@sendgrid/mail';

import { PrismaService } from '../database/prisma.service';

import axios from 'axios';

@Injectable()
export class OpenmeshExpertsEmailManagerService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}
  sgApiKey = process.env.SG_API_KEY;

  async emailRecPassword(email: string, id: string) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: email,
      from: 'movviaugust@gmail.com',
      template_id: 'd-bcd38e413f4b46cc9d1b2e50d1052320',
      dynamic_template_data: {
        objectId: id,
      },
    };
    await sgMail
      .send(msg)
      .then(() => {
        return 'email sent';
      })
      .catch(async (error) => {
        console.log(`Error during email recover password - ${email}`);
        console.log(error);
        return error;
      });
  }

  async emailConfirmationAccount(email, objectId) {
    console.log('chamado');
    sgMail.setApiKey(this.sgApiKey);
    console.log(this.sgApiKey);
    const msg: any = {
      to: email,
      from: 'movviaugust@gmail.com',
      template_id: 'd-5ff3c619db7842c5925199f21d8f10de',
      dynamic_template_data: {
        objectId: objectId,
      },
    };
    await sgMail
      .send(msg)
      .then(() => {
        console.log('confirmed');
        return 'email sent';
      })
      .catch(async (error) => {
        console.log(`Error during email recover password - ${email}`);
        console.log(error);
        return error;
      });
  }
}
