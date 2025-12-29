import { IncomingMessage } from 'http';

interface ParsedFormData {
  [key: string]: string | Buffer;
}

/**
 * Simple multipart form data parser
 * In production, consider using a library like 'formidable' or 'busboy'
 */
export function parseMultipartFormData(req: IncomingMessage): Promise<ParsedFormData> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      // Try parsing as JSON
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Invalid content type'));
        }
      });
      return;
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      reject(new Error('No boundary found'));
      return;
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const result = parseMultipart(buffer, boundary);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function parseMultipart(buffer: Buffer, boundary: string): ParsedFormData {
  const result: ParsedFormData = {};
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = splitBuffer(buffer, boundaryBuffer);

  for (const part of parts) {
    if (part.length < 4) continue;

    const headerEnd = findDoubleCRLF(part);
    if (headerEnd === -1) continue;

    const header = part.slice(0, headerEnd).toString();
    let content = part.slice(headerEnd + 4);

    const nameMatch = header.match(/name="([^"]+)"/);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    const filenameMatch = header.match(/filename="([^"]+)"/);

    // Remove trailing CRLF or newlines
    while (
      content.length > 0 &&
      (content[content.length - 1] === 0x0a || content[content.length - 1] === 0x0d)
    ) {
      content = content.slice(0, -1);
    }

    if (filenameMatch) {
      // Binary file content
      result[name] = content;
    } else {
      // Text field
      result[name] = content.toString().trim();
    }
  }

  return result;
}

function splitBuffer(buffer: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  let index: number;

  while ((index = buffer.indexOf(delimiter, start)) !== -1) {
    if (index > start) {
      parts.push(buffer.slice(start, index));
    }
    start = index + delimiter.length;
    // Skip CRLF after boundary
    if (buffer[start] === 0x0d && buffer[start + 1] === 0x0a) {
      start += 2;
    }
  }

  if (start < buffer.length) {
    parts.push(buffer.slice(start));
  }

  return parts;
}

function findDoubleCRLF(buffer: Buffer): number {
  for (let i = 0; i < buffer.length - 3; i++) {
    if (
      buffer[i] === 0x0d &&
      buffer[i + 1] === 0x0a &&
      buffer[i + 2] === 0x0d &&
      buffer[i + 3] === 0x0a
    ) {
      return i;
    }
  }
  return -1;
}
