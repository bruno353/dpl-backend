import { readFile } from 'fs/promises';
import { import_ } from '@brillout/import';

export abstract class BufferLoader extends (null as any) {
  constructor(public filePathOrBlob: string | Blob) {
    super();
  }

  protected abstract parse(raw: Buffer, metadata: any): Promise<any>;

  public async load(): Promise<any> {
    const { BaseDocumentLoader } = await import_('langchain/document_loaders');
    Object.setPrototypeOf(this, BaseDocumentLoader.prototype);
    let buffer: Buffer;
    let metadata: Record<string, string>;
    if (typeof this.filePathOrBlob === 'string') {
      buffer = await readFile(this.filePathOrBlob);
      metadata = { source: this.filePathOrBlob };
    } else {
      buffer = await this.filePathOrBlob
        .arrayBuffer()
        .then((ab) => Buffer.from(ab));
      metadata = { source: 'blob', blobType: this.filePathOrBlob.type };
    }
    return this.parse(buffer, metadata);
  }
}

export class CustomPDFLoader extends BufferLoader {
  public async parse(raw: Buffer, metadata: any): Promise<any> {
    const { Document } = await import_('langchain/document');
    const { pdf } = await PDFLoaderImports();
    const parsed = await pdf(raw);
    return [
      new Document({
        pageContent: parsed.text,
        metadata: {
          ...metadata,
          pdf_numpages: parsed.numpages,
        },
      }),
    ];
  }
}

async function PDFLoaderImports() {
  try {
    // the main entrypoint has some debug code that we don't want to import
    const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js');
    return { pdf };
  } catch (e) {
    console.error(e);
    throw new Error(
      'Failed to load pdf-parse. Please install it with eg. `npm install pdf-parse`.',
    );
  }
}
