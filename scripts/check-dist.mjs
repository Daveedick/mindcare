import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const credentialPattern = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|glpat-[A-Za-z0-9_-]{20,})\b/;
async function scan(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) await scan(file);
    else if (/\.(?:js|css|html|json|webmanifest|svg)$/.test(file)) {
      if (credentialPattern.test(await readFile(file, 'utf8'))) throw new Error('Credential-like value found in browser output: ' + file);
    }
  }
}
await scan('dist');
console.log('Browser artifact credential scan passed.');
