import { defineEventHandler } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async () => {
  const certDir = path.resolve(process.cwd(), 'certs');
  const result: Record<string, string> = {};

  if (fs.existsSync(certDir)) {
    const files = fs.readdirSync(certDir);
    for (const file of files) {
      if (file.endsWith('.crt')) {
        const content = fs.readFileSync(path.join(certDir, file), 'utf-8');
        result[file] = content;
      }
    }
  }
  console.log('Certificates loaded:', Object.keys(result));
  return result;
});