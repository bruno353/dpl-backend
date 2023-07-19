import {
  ConflictException,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import { join, extname } from 'path';
import { Configuration, OpenAIApi } from 'openai';
import * as FormData from 'form-data';
import { import_ } from '@brillout/import';
import { ethers } from 'ethers';
import { SimpleCrypto } from 'simple-crypto-js';

import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

import erc20ABI from './contract/erc20.json';

import { PineconeClient } from '@pinecone-database/pinecone';

import { DidDTO } from './dto/did.dto';
import { Request, response } from 'express';
import { AuthUsuarioDTO } from './dto/auth-usuario.dto';
import { AuthService } from 'src/auth/auth.service';
import axios from 'axios';

@Injectable()
export class CreditService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}
  simpleCryptoJs = new SimpleCrypto(process.env.CIPHER);

  usdcAddress = process.env.USDC_ADDRESS;

  web3UrlProvider = process.env.WEB3_URL_PROVIDER;
  web3Provider = new ethers.providers.JsonRpcProvider(this.web3UrlProvider);

  viewPrivateKey =
    'a7ec59c41ec3608dece33851a7d805bf22cd33da3e22e438bfe033349eb04011';

  contaAzulClientId = process.env.CONTA_AZUL_CLIENT_ID;
  contaAzulClientSecret = process.env.CONTA_AZUL_CLIENT_SECRET;
  contaAzulRedirectURI = process.env.CONTA_AZUL_REDIRECT;

  //chaves da pluggy
  clientId = process.env.CLIENT_ID;
  clientSecret = process.env.CLIENT_SECRET;

  async ocrFilesSummary(files: Array<Express.Multer.File>): Promise<any> {
    if (files) {
      const finalResponse = {};
      for (const file of files) {
        console.log('File found, trying to upload...');
        const base64Image = Buffer.from(file.buffer).toString('base64');
        const ext = extname(file.originalname).substring(1);
        const mimeType = `image/${ext}`;
        const formattedFile = `data:${mimeType};base64,${base64Image}`;
        const data = new FormData();
        data.append('language', 'por');
        data.append('isOverlayRequired', 'false');
        data.append('base64image', formattedFile);
        data.append('filetype', ext);
        data.append('iscreatesearchablepdf', 'false');
        data.append('OCREngine', '5');
        data.append('isTable', 'true');
        data.append('issearchablepdfhidetextlayer', 'false');
        //chamando api ocr:
        const config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://api.ocr.space/parse/image',
          headers: {
            apikey: 'K84182288688957',
            ...data.getHeaders(),
          },
          data: data,
        };
        let desc;
        await axios
          .request(config)
          .then((response) => {
            console.log(
              JSON.stringify(response.data['ParsedResults'][0]['ParsedText']),
            );
            console.log('eu passei por aqui sim');
            desc = JSON.stringify(
              response.data['ParsedResults'][0]['ParsedText'],
            );
            // console.log(response.data['ParsedResults'][0]['ParsedText']);
          })
          .catch((error) => {
            console.log(error);
          });
        const resp = await this.summaryOpenAiFile(desc);
        finalResponse[file.originalname] = resp[0]['message']['content'];
        await this.wait(2000);
      }
      return finalResponse;
    } else {
      throw new BadRequestException('Arquivos não detectados', {
        cause: new Error(),
        description: 'Arquivos não detectados',
      });
    }
  }

  async ocrFilesFinancialIndex(
    files: Array<Express.Multer.File>,
  ): Promise<any> {
    if (files) {
      const finalResponse = [];
      for (const file of files) {
        console.log('File found, trying to upload...');
        const base64Image = Buffer.from(file.buffer).toString('base64');
        const ext = extname(file.originalname).substring(1);
        const mimeType = `image/${ext}`;
        const formattedFile = `data:${mimeType};base64,${base64Image}`;
        const data = new FormData();
        data.append('language', 'por');
        data.append('isOverlayRequired', 'false');
        data.append('base64image', formattedFile);
        data.append('filetype', ext);
        data.append('iscreatesearchablepdf', 'false');
        data.append('OCREngine', '5');
        data.append('isTable', 'true');
        data.append('issearchablepdfhidetextlayer', 'false');
        //chamando api ocr:
        const config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://api.ocr.space/parse/image',
          headers: {
            apikey: 'K84182288688957',
            ...data.getHeaders(),
          },
          data: data,
        };
        let desc;
        await axios
          .request(config)
          .then((response) => {
            console.log(
              JSON.stringify(response.data['ParsedResults'][0]['ParsedText']),
            );
            console.log('eu passei por aqui sim');
            desc = JSON.stringify(
              response.data['ParsedResults'][0]['ParsedText'],
            );
            // console.log(response.data['ParsedResults'][0]['ParsedText']);
          })
          .catch((error) => {
            console.log('erro aqui.');
            console.log(error);
          });
        finalResponse.push(desc);
        await this.wait(2000);
      }
      const content = await this.financialIndexOpenAiFile(finalResponse);
      console.log(content[0]['message']['content'].replace(/\\n/g, '\n'));
      return content[0]['message'];
    } else {
      throw new BadRequestException('Arquivos não detectados', {
        cause: new Error(),
        description: 'Arquivos não detectados',
      });
    }
  }

  async myTest(file: Express.Multer.File) {
    const { RecursiveCharacterTextSplitter } = await import_(
      'langchain/text_splitter',
    );
    const { DirectoryLoader, TextLoader, CSVLoader } = await import_(
      'langchain/document_loaders',
    );
    const { OpenAIEmbeddings } = await import_('langchain/embeddings');
    const { PineconeStore } = await import_('langchain/vectorstores');
    const { CreateCSVAgent, tuaBundaP } = await import_('langchain/chains');

    console.log('fui chamadu');
    try {
      process.env.OPENAI_API_KEY =
        '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';

      console.log(file);
      const csvLoader = new CSVLoader('./src/auth/csvWellbe.csv');
      const csvDocs = await csvLoader.load();
      // const loader = new TextLoader('./src/auth/tabelaCSVTeste5.csv');
      // const rawDocs = await loader.load();
      console.log(csvLoader);
      console.log(csvDocs);
      console.log('fui chamadu2');
      /* Split text into chunks */
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
      });

      const docs = await textSplitter.splitDocuments(csvDocs);
      console.log('split docs', docs);

      console.log('creating vector store...');
      /*create and store the embeddings in the vectorStore*/
      const pinecone = new PineconeClient();
      const PINECONE_INDEX_NAME = 'credito-workspace';
      const PINECONE_NAME_SPACE = 'tabela-csv-teste12'; //namespace is optional for your vectors
      await pinecone.init({
        environment: 'us-east4-gcp', //this is in the dashboard
        apiKey: '13647643-e7e7-4a8a-9736-b16a4f24e1f1',
      });
      const embeddings = new OpenAIEmbeddings();
      const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

      //embed the PDF documents
      await PineconeStore.fromDocuments(docs, embeddings, {
        pineconeIndex: index,
        namespace: PINECONE_NAME_SPACE,
        textKey: 'text',
      });
    } catch (error) {
      console.log('error', error);
      throw new Error('Failed to ingest your data');
    }
  }

  async myTestMultipleUploads() {
    const { RecursiveCharacterTextSplitter } = await import_(
      'langchain/text_splitter',
    );
    const { DirectoryLoader, TextLoader, CSVLoader } = await import_(
      'langchain/document_loaders',
    );
    const { OpenAIEmbeddings } = await import_('langchain/embeddings');
    const { PineconeStore } = await import_('langchain/vectorstores');
    const { CreateCSVAgent } = await import_('langchain/chains');

    console.log('fui chamadu');
    try {
      process.env.OPENAI_API_KEY =
        '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';

      const loader = new DirectoryLoader('./src/auth/uploadFilesCSV', {
        '.csv': (path) => new CSVLoader(path),
      });
      const myDocs = await loader.load();
      console.log({ myDocs });
      /* Split text into chunks */
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
      });

      console.log('creating vector store...');
      /*create and store the embeddings in the vectorStore*/
      const pinecone = new PineconeClient();
      const PINECONE_INDEX_NAME = 'credito-workspace';
      const PINECONE_NAME_SPACE = 'tabela-csv-teste16'; //namespace is optional for your vectors
      await pinecone.init({
        environment: 'us-east4-gcp', //this is in the dashboard
        apiKey: '13647643-e7e7-4a8a-9736-b16a4f24e1f1',
      });
      const embeddings = new OpenAIEmbeddings();
      const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

      //embed the PDF documents
      await PineconeStore.fromDocuments(myDocs, embeddings, {
        pineconeIndex: index,
        namespace: PINECONE_NAME_SPACE,
        textKey: 'text',
      });
    } catch (error) {
      console.log('error', error);
      throw new Error('Failed to ingest your data');
    }
  }
  async testGoogle() {
    // eslint-disable-next-line prettier/prettier
    const { OpenAI } = await import_('langchain');
    const { initializeAgentExecutor, ZapierToolKit } = await import_(
      'langchain/agents',
    );
    const { ZapierNLAWrapper } = await import_('langchain/tools');

    process.env.ZAPIER_NLA_API_KEY = 'sk-ak-WZ1LcYMktUIGiwY4MxOjiiXSXp';
    process.env.OPENAI_API_KEY =
      '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';
    const model = new OpenAI({ temperature: 0 });
    const zapier = new ZapierNLAWrapper();
    const toolkit = await ZapierToolKit.fromZapierNLAWrapper(zapier);

    const executor = await initializeAgentExecutor(
      toolkit.tools,
      model,
      'zero-shot-react-description',
      true,
    );
    console.log('Loaded agent.');

    const input = `Find the last google doc created called ttttt and summarize it`;

    console.log(`Executing with input "${input}"...`);

    const result = await executor.call({ input });

    console.log(`Got output ${result.output}`);
  }
  async myTest2() {
    const { OpenAIChat } = await import_('langchain/llms');
    const { LLMChain, ChatVectorDBQAChain, loadQAChain } = await import_(
      'langchain/chains',
    );
    const { PineconeStore } = await import_('langchain/vectorstores');
    const { PromptTemplate } = await import_('langchain/prompts');
    const { CallbackManager } = await import_('langchain/callbacks');
    const { OpenAIEmbeddings } = await import_('langchain/embeddings');
    console.log('oii');
    const CONDENSE_PROMPT = PromptTemplate.fromTemplate('Qual o meu nome?');
    const QA_PROMPT = PromptTemplate.fromTemplate(
      'You are an AI assistant providing helpful advice. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided. You should only provide hyperlinks that reference the context below. Do NOT make up hyperlinks. If you cant find the answer in the context below, just say "Hmm, Im not sure." Dont try to make up an answer.',
    );
    const questionGenerator = new LLMChain({
      llm: new OpenAIChat({ temperature: 0 }),
      prompt: CONDENSE_PROMPT,
    });
    const docChain = await loadQAChain(
      new OpenAIChat({
        temperature: 0,
        modelName: 'gpt-3.5-turbo', //change this to older versions (e.g. gpt-3.5-turbo) if you don't have access to gpt-4
      }),
      { prompt: QA_PROMPT },
    );

    const pinecone = new PineconeClient();
    await pinecone.init({
      environment: 'us-east4-gcp', //this is in the dashboard
      apiKey: '13647643-e7e7-4a8a-9736-b16a4f24e1f1',
    });

    const PINECONE_INDEX_NAME = 'credito-workspace';
    const PINECONE_NAME_SPACE = 'pdf-test';
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({}),
      {
        pineconeIndex: index,
        textKey: 'text',
        namespace: PINECONE_NAME_SPACE,
      },
    );

    const resposta = await new ChatVectorDBQAChain({
      vectorStore,
      combineDocumentsChain: docChain,
      questionGeneratorChain: questionGenerator,
    });
    const response = await resposta.call({
      question: 'Qual o meu nome?',
      chat_history: [],
    });

    console.log('response', response);
    console.log(resposta);
    return resposta;
  }

  async myTest3() {
    const { RecursiveCharacterTextSplitter } = await import_(
      'langchain/text_splitter',
    );
    const { DirectoryLoader, TextLoader } = await import_(
      'langchain/document_loaders',
    );
    const { OpenAIChat } = await import_('langchain/llms');
    const { LLMChain, ChatVectorDBQAChain, loadQAChain } = await import_(
      'langchain/chains',
    );
    const { PineconeStore, Pinecone, Chroma } = await import_(
      'langchain/vectorstores',
    );
    const { PromptTemplate } = await import_('langchain/prompts');
    const { CallbackManager } = await import_('langchain/callbacks');
    const { OpenAI } = await import_('langchain');
    const { OpenAIEmbeddings } = await import_('langchain/embeddings');
    const { ConversationChain } = await import_('langchain/chains');
    const embeddings = new OpenAIEmbeddings();
    type PineConeMetadata = Record<string, any>;
    process.env.OPENAI_API_KEY =
      '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';
    const pinecone = new PineconeClient();

    await pinecone.init({
      environment: 'us-east4-gcp', //this is in the dashboard
      apiKey: '13647643-e7e7-4a8a-9736-b16a4f24e1f1',
    });

    // retrieve API operations for index created in pinecone dashboard
    const index = pinecone.Index('credito-workspace');

    // crosscheck your index (that contains embeddings of your docs) exists in the vectorstore
    const indexData = await index.describeIndexStats({
      describeIndexStatsRequest: {},
    });

    console.log('indexData', indexData);

    const query =
      'Some todas os valores referentes a receita do documento da Wellbe';
    const namespace = 'tabela-csv-teste16';

    const response = await this.callVectorDBQAChain(query, index, namespace);
    console.log('answer', response);
  }

  async embedQuery(query: string, embeddings: any): Promise<number[]> {
    const embeddedQuery = await embeddings.embedQuery(query);
    console.log('embeddedQuery', embeddedQuery);
    return embeddedQuery;
  }

  async similarityVectorSearch(
    vectorQuery: number[],
    k = 3,
    index: any,
    namespace: string,
  ): Promise<any> {
    const { Document } = await import_('langchain/document');
    type PineConeMetadata = Record<string, any>;
    const results = await index.query({
      queryRequest: {
        topK: k,
        includeMetadata: true,
        vector: vectorQuery,
        namespace,
      },
    });

    const result: [Document, number][] = [];

    if (results.matches) {
      for (const res of results.matches) {
        console.log('res', res);
        const { text: pageContent, ...metadata } =
          res?.metadata as PineConeMetadata;
        if (res.score) {
          result.push([new Document({ metadata, pageContent }), res.score]);
        }
      }
    }

    return result.map((result) => result[0]);
  }

  async callVectorDBQAChain(query: string, index: any, namespace: string) {
    const { OpenAIEmbeddings } = await import_('langchain/embeddings');
    const { OpenAI } = await import_('langchain');
    const { loadQAChain } = await import_('langchain/chains');
    const { PromptTemplate } = await import_('langchain/prompts');
    const question = query;
    const returnedResults = 3;
    const embeddings = new OpenAIEmbeddings();
    const questionEmbedding = await this.embedQuery(question, embeddings);
    const docs = await this.similarityVectorSearch(
      questionEmbedding,
      returnedResults,
      index,
      namespace,
    );
    const inputs = { question, input_documents: docs };
    const llm = new OpenAI({ modelName: 'text-davinci-003', temperature: 0 });
    const QA_PROMPT = PromptTemplate.fromTemplate(
      `You are an AI assistant providing helpful advice. You are given the following extracted parts of a long document and a question. The question will ask you to extract some information in the documentation.
    If the answer can not be find in the given context, try to calculate the answer.
    You can give answers that is not related to the context, too.
    Question: Qual a receita líquida em 2022?.
    =========
    {context}
    =========
    Answer in Markdown:`,
    );
    const qaChain = loadQAChain(llm, {
      prompt: QA_PROMPT,
      type: 'stuff',
    });
    console.log('qachain', qaChain);
    const result = await qaChain.call(inputs);
    console.log('result', result);
    return result;
  }

  async uploadFiles(
    data: any,
    files: Array<Express.Multer.File>,
    req: Request,
  ) {
    const accessToken = String(req.headers['x-parse-session-token']);

    const user = await this.authService.verifySessionToken(accessToken);

    if (!user.isBorrower)
      throw new BadRequestException('User', {
        cause: new Error(),
        description: 'Only borrowers can do this connection',
      });
    console.log('passei aqui');
    const { RecursiveCharacterTextSplitter } = await import_(
      'langchain/text_splitter',
    );
    const { DirectoryLoader, TextLoader, CSVLoader } = await import_(
      'langchain/document_loaders',
    );
    const { OpenAIEmbeddings } = await import_('langchain/embeddings');
    const { PineconeStore } = await import_('langchain/vectorstores');
    const { CreateCSVAgent } = await import_('langchain/chains');

    if (files) {
      console.log(files);
      for (const file of files) {
        try {
          process.env.OPENAI_API_KEY =
            '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';
          console.log(file.path);
          const csvLoader = new CSVLoader(file.path);
          const csvDocs = await csvLoader.load();
          console.log(csvLoader);
          console.log(csvDocs);
          console.log('fui chamadu2');
          return;
          /* Split text into chunks */
          const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
          });

          const docs = await textSplitter.splitDocuments(csvDocs);
          console.log('split docs', docs);

          console.log('creating vector store...');
          /*create and store the embeddings in the vectorStore*/
          const pinecone = new PineconeClient();
          const PINECONE_INDEX_NAME = 'credito-workspace';
          const PINECONE_NAME_SPACE = 'tabela-csv-teste20'; //namespace is optional for your vectors
          await pinecone.init({
            environment: 'us-east4-gcp', //this is in the dashboard
            apiKey: '13647643-e7e7-4a8a-9736-b16a4f24e1f1',
          });
          const embeddings = new OpenAIEmbeddings();
          const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

          //embed the PDF documents
          await PineconeStore.fromDocuments(docs, embeddings, {
            pineconeIndex: index,
            namespace: PINECONE_NAME_SPACE,
            textKey: 'text',
          });
        } catch (error) {
          console.log('error', error);
          throw new Error('Failed to ingest your data');
        }
      }
    }
  }
  //**FUNÇÕES */

  //função para esperar x milisegundos até prosseguir o código:
  async wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  //função que retorna um resumo sobre um arquivo - openai:
  async summaryOpenAiFile(desc: string): Promise<any> {
    const configuration = new Configuration({
      apiKey: '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',
    });
    const openai = new OpenAIApi(configuration);
    const model = 'gpt-3.5-turbo';
    const messages: any = [
      {
        role: 'system',
        content:
          'Você é um analista de crédito ajudante extremamente experiente. Você deve fazer respostas concisas',
      },
      {
        role: 'assistant',
        content: desc,
      },
      {
        role: 'user',
        content:
          'Baseando-se nessa tabela anterior, me diga sobre o que se trata e me dê informações interessantes sobre, apresentando os números. ',
      },
    ];
    const completion = await openai.createChatCompletion({
      model,
      messages,
    });
    console.log(completion.data.choices);
    console.log(completion.data.usage);
    return completion.data.choices;
  }

  //função que retorna um resumo de índices financeiros dos files - openai:
  async financialIndexOpenAiFile(descs: Array<string>): Promise<any> {
    const configuration = new Configuration({
      apiKey: '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',
    });
    const openai = new OpenAIApi(configuration);
    const model = 'gpt-3.5-turbo';
    const messages: any = [
      {
        role: 'system',
        content:
          'Você é um analista de crédito ajudante extremamente experiente. Você deve fazer respostas concisas',
      },
    ];
    for (const desc of descs) {
      const objDesc = {
        role: 'assistant',
        content: desc,
      };
      messages.push(objDesc);
    }
    const userDesc = {
      role: 'user',
      content:
        'Com está tabela que enviei a você, me diga qual foi o mês que obteve maior receita e o mes que obteve maior despesa, depois me diga qual a média dos valores das receitas..',
    };
    messages.push(userDesc);
    let completion;
    try {
      completion = await openai.createChatCompletion({
        model,
        messages,
      });
    } catch (err) {
      console.log('erro aqui');
      console.log(err);
    }
    console.log(completion.data.choices);
    console.log(completion.data.usage);
    return completion.data.choices;
  }

  async getSecrets() {
    const response = await axios.get(
      `https://${process.env.DOPPLER_TOKEN}@api.doppler.com/v3/configs/config/secrets/download?format=json`,
    );
    return response.data.CYPHER;
  }
}
