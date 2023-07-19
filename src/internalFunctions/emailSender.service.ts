import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// import { import_ } from '@brillout/import';
import * as sgMail from '@sendgrid/mail';

import { PrismaService } from '../database/prisma.service';
import { LogService } from '../internalFunctions/log.service';

import axios from 'axios';

@Injectable()
export class EmailSenderService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
  ) {}
  sgApiKey = process.env.SG_API_KEY;

  async emailNovoUserADM(email: string, nome: string) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: ['brunolsantos152@gmail.com.br'],
      from: 'movviaugust@gmail.com',
      subject: 'Novo usuário ADM registrado - plataforma Scalable',
      text: 'Novo usuário ADM registrado - plataforma Scalable',
      html: `<p>Email: ${email}  <br>
                  Nome: ${nome}    <br> `,
    };
    await sgMail.send(msg).catch(async (error) => {
      this.logService.createErrorLog(
        'emailNovoUserADM',
        JSON.stringify(error),
        JSON.stringify(error['response']['data']),
        JSON.stringify(msg),
        undefined,
        undefined,
      );
      console.log(error);
    });
  }

  async emailNovoUser(data: any) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: [
        'scalable3.0@gmail.com',
        'marcelo@scalable.com.br',
        'rafael@scalable.com.br',
      ],
      from: 'movviaugust@gmail.com',
      subject: 'Novo usuário registrado - plataforma Scalable',
      text: 'Novo usuário registrado - plataforma Scalable',
      html: `<p>Email: ${data.email}  <br>
                    Nome: ${data.nome}    <br> 
                    Nome Empresa: ${data.nomeEmpresa} <br>
                    Sobre:  ${data.sobre} <br>
                    CNPJ: ${data.cnpj} <br>
                    ARR: ${data.arr} <br>
                    Runway: ${data.runway} <br>
                    </p>`,
    };
    await sgMail.send(msg).catch(async (error) => {
      this.logService.createErrorLog(
        'emailNovoUser',
        JSON.stringify(error),
        JSON.stringify(error['response']['data']),
        JSON.stringify(msg),
        undefined,
        undefined,
      );
      console.log(error);
    });
  }

  //Envia um email (no nome do comercial) para o user de boas vindas - lead.
  async emailNovoUserLead(data: any) {
    sgMail.setApiKey(this.sgApiKey);
    console.log('CHAMADNO EMAIL lead');
    const msg: any = {
      to: data.email,
      from: {
        email: 'rafael@scalable.com.br',
        name: 'Rafael, da Scalable',
      },
      cc: 'marcelo@scalable.com.br',
      template_id: 'd-ab04e02b25b54f3d88a54842feb16de8',
      dynamic_template_data: {
        userNome: data.nome,
        userNomeEmpresa: data.nomeEmpresa,
      },
    };
    await sgMail
      .send(msg)
      .then(() => {
        return 'email sent';
      })
      .catch(async (error) => {
        console.log(error);
        this.logService.createErrorLog(
          'emailNovoUserLead',
          JSON.stringify(error),
          JSON.stringify(error['response']['data']),
          JSON.stringify(msg),
          undefined,
          undefined,
        );
        return error;
      });
  }

  //email de cobrança para user - ele tem um pagamento que vencerá daqui a 5 dias
  async emailCobranca5Dias(data: any) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: ['brunolsantos152@gmail.com'],
      from: 'movviaugust@gmail.com',
      subject: 'Bem vindo - Scalable',
      text: 'Bem vindo - Scalable',
      html: `<p>Olá, voce possui uma cobrança para daqui a 5 dias.  <br>
              Att,
              <br> 
              </p>`,
    };
    await sgMail.send(msg).catch(async (error) => {
      this.logService.createErrorLog(
        'emailNovoUserLead',
        JSON.stringify(error),
        JSON.stringify(error['response']['data']),
        JSON.stringify(msg),
        undefined,
        undefined,
      );
      console.log(error);
    });
  }

  async emailRecSenha(email: string, id: string) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: email,
      from: 'contato@scalable.com.br',
      template_id: 'd-dba4aae843174903a73e2d2c93738e22',
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
        this.logService.createErrorLog(
          'emailRecSenha',
          JSON.stringify(error),
          JSON.stringify(error['response']['data']),
          JSON.stringify(msg),
          undefined,
          undefined,
        );
        return error;
      });
  }

  async emailNewsletter(email: string) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: [
        'scalable3.0@gmail.com',
        'marcelo@scalable.com.br',
        'rafael@scalable.com.br',
      ],
      from: 'movviaugust@gmail.com',
      subject: 'Novo "fale conosco" registrado - plataforma Scalable',
      text: 'Novo "fale conosco" registrado - plataforma Scalable',
      html: `<p>Email: ${email}  <br>`,
    };
    await sgMail.send(msg).catch(async (error) => {
      this.logService.createErrorLog(
        'emailNewsletter',
        JSON.stringify(error),
        JSON.stringify(error['response']['data']),
        JSON.stringify(msg),
        undefined,
        undefined,
      );
      console.log(error);
    });
  }
  async emailSaasMVPNewsletter(email: string, feedback) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: [
        'scalable3.0@gmail.com',
        'marcelo@scalable.com.br',
        'rafael@scalable.com.br',
      ],
      from: 'movviaugust@gmail.com',
      subject: 'Nova inscrição de interesse SaaS MVP Scalable',
      text: 'Nova inscrição de interesse SaaS MVP Scalable',
      html: `<p>Email: ${email}  <br>
                Feedback: ${feedback}`,
    };
    await sgMail.send(msg).catch(async (error) => {
      this.logService.createErrorLog(
        'emailNewsletter',
        JSON.stringify(error),
        JSON.stringify(error['response']['data']),
        JSON.stringify(msg),
        undefined,
        undefined,
      );
      console.log(error);
    });
  }

  async emailConfirmacaoConta(objectId, email) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: email,
      from: 'contato@scalable.com.br',
      template_id: 'd-75cb718921034a9e963c480d5ef497d1',
      dynamic_template_data: {
        objectId: objectId,
      },
    };
    await sgMail
      .send(msg)
      .then(() => {
        return 'email sent';
      })
      .catch(async (err) => {
        this.logService.createErrorLog(
          'sendEmail',
          JSON.stringify(err),
          JSON.stringify(err['response']['data']),
          JSON.stringify(msg),
          undefined,
          undefined,
        );
        console.log(err);
        return err;
      });
  }

  async emailNovoUploadArquivos(email: string) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: [
        'scalable3.0@gmail.com',
        'guilherme@scalable.com.br',
        'marcelo@scalable.com.br',
        'rafael@scalable.com.br',
      ],
      from: 'movviaugust@gmail.com',
      subject:
        'Um usuário acabou de fazer upload de arquivos - plataforma Scalable',
      text: 'Um usuário acabou de fazer upload de arquivos - plataforma Scalable',
      html: `<p>Usuário - ${email} realizou upload de arquivos na plataforma.<br>`,
    };
    await sgMail.send(msg).catch(async (error) => {
      this.logService.createErrorLog(
        'emailNovoUploadArquivos',
        JSON.stringify(error),
        JSON.stringify(error['response']['data']),
        JSON.stringify(msg),
        undefined,
        undefined,
      );
      console.log(error);
    });
  }

  //email avisando os adms da nova proposta
  async emailNovaPropostaCreditoSubmetidaADM(
    admEmail: string,
    email: string,
    propostaData: any,
  ) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: [
        'brunolsantos152@gmail.com',
        'scalable3.0@gmail.com',
        'marcelo@scalable.com.br',
        'guilherme@scalable.com.br',
        'rafael@scalable.com.br',
      ],
      from: 'movviaugust@gmail.com',
      subject:
        'Uma nova proposta de crédito foi submetida - plataforma Scalable',
      text: 'Uma nova proposta de crédito foi submetida - plataforma Scalable',
      html: `<p>O usuário administrador ${admEmail} acabou de submeter uma proposta de crédito para o usuário ${email}.<br>
                Montante: ${propostaData.montanteProposto}<br>
                Termo: ${propostaData.termoProposto}<br>
                Taxa mensal: ${propostaData.taxaJurosProposto}`,
    };
    await sgMail.send(msg).catch(async (error) => {
      this.logService.createErrorLog(
        'emailNovaPropostaCreditoSubmetidaADM',
        JSON.stringify(error),
        JSON.stringify(error['response']['data']),
        JSON.stringify(msg),
        undefined,
        undefined,
      );
      console.log(error);
    });
  }

  //email avisando os users da nova proposta
  async emailNovaPropostaCreditoSubmetidaUser(email: string) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: [email],
      from: 'contato@scalable.com.br',
      template_id: 'd-48c7c8fd76da472db78411684fca7538',
    };
    await sgMail.send(msg).catch(async (error) => {
      this.logService.createErrorLog(
        'emailNovaPropostaCreditoSubmetidaUser',
        JSON.stringify(error),
        JSON.stringify(error['response']['data']),
        JSON.stringify(msg),
        undefined,
        undefined,
      );
      console.log(error);
    });
  }

  async emailPropostaCreditoVisualizada(email: string, propostaData: any) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: [
        'brunolsantos152@gmail.com',
        'scalable3.0@gmail.com',
        'marcelo@scalable.com.br',
        'guilherme@scalable.com.br',
        'rafael@scalable.com.br',
      ],
      from: 'movviaugust@gmail.com',
      subject: 'Uma proposta de crédito foi visualizada - plataforma Scalable',
      text: 'Uma proposta de crédito foi visualizada- plataforma Scalable',
      html: `<p>O usuário ${email} acabou de visualizar uma proposta de crédito.<br>
                Montante: ${propostaData.montanteProposto}<br>
                Termo: ${propostaData.termoProposto}<br>
                Taxa mensal: ${propostaData.taxaJurosProposto}`,
    };
    await sgMail.send(msg).catch(async (error) => {
      this.logService.createErrorLog(
        'emailPropostaCreditoVisualizada',
        JSON.stringify(error),
        JSON.stringify(error['response']['data']),
        JSON.stringify(msg),
        undefined,
        undefined,
      );
      console.log(error);
    });
  }

  async emailPropostaCreditoAceita(email: string, propostaData: any) {
    sgMail.setApiKey(this.sgApiKey);

    const msg: any = {
      to: [
        'brunolsantos152@gmail.com',
        'scalable3.0@gmail.com',
        'marcelo@scalable.com.br',
        'guilherme@scalable.com.br',
        'rafael@scalable.com.br',
      ],
      from: 'movviaugust@gmail.com',
      subject: 'Uma proposta de crédito foi aceita - plataforma Scalable',
      text: 'Uma proposta de crédito foi aceita - plataforma Scalable',
      html: `<p>O usuário ${email} acabou de aceitar uma proposta de crédito e enviar os contratos de clientes.<br>
                Montante requisitado: ${propostaData.montanteRequisitado}<br>
                Termo: ${propostaData.termoProposto}<br>
                Taxa mensal: ${propostaData.taxaJurosProposto}`,
    };
    await sgMail.send(msg).catch(async (error) => {
      this.logService.createErrorLog(
        'emailPropostaCreditoVisualizada',
        JSON.stringify(error),
        JSON.stringify(error['response']['data']),
        JSON.stringify(msg),
        undefined,
        undefined,
      );
      console.log(error);
    });
  }

  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
