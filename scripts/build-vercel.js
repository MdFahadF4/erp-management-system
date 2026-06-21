/**
 * Vercel production build: copy static frontend into dist/ and generate js/config.js there.
 * Local dev can keep using repo root + js/config.js (gitignored) without running this.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');

const apiUrl = process.env.API_URL?.trim();
const clientToken = process.env.CLIENT_TOKEN?.trim();

if (!apiUrl || !clientToken) {
  console.error('');
  console.error('ERROR: Missing required environment variables.');
  console.error('  Set API_URL and CLIENT_TOKEN in Vercel → Project → Settings → Environment Variables');
  console.error('');
  process.exit(1);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

const runtimeConfig = { API_URL: apiUrl, CLIENT_TOKEN: clientToken };
let html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const runtimeScript = `<script>window.__ERP_CONFIG__=${JSON.stringify(runtimeConfig)};</script>`;
if (!html.includes('window.__ERP_CONFIG__')) {
  html = html.replace(
    '<script type="module" src="./js/app.js"></script>',
    `${runtimeScript}\n  <script type="module" src="./js/app.js"></script>`
  );
}
fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
copyDir(path.join(rootDir, 'css'), path.join(distDir, 'css'));

const jsSrc = path.join(rootDir, 'js');
const jsDest = path.join(distDir, 'js');
fs.mkdirSync(jsDest, { recursive: true });

for (const file of fs.readdirSync(jsSrc)) {
  if (!file.endsWith('.js') || file === 'config.js') continue;
  fs.copyFileSync(path.join(jsSrc, file), path.join(jsDest, file));
}

const configContent = `/**
 * Auto-generated at deploy time — do not edit on the server.
 * Source: Vercel environment variables API_URL and CLIENT_TOKEN.
 */
export const API_URL = ${JSON.stringify(apiUrl)};
export const CLIENT_TOKEN = ${JSON.stringify(clientToken)};
`;

fs.writeFileSync(path.join(jsDest, 'config.js'), configContent, 'utf8');

console.log('Vercel build complete: dist/ ready (runtime config in index.html + js/config.js).');
