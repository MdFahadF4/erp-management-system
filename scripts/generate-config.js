/**
 * Runs on Vercel during deploy.
 * Reads API_URL and CLIENT_TOKEN from environment variables
 * and writes js/config.js (never commit that file to GitHub).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiUrl = process.env.API_URL?.trim();
const clientToken = process.env.CLIENT_TOKEN?.trim();

if (!apiUrl || !clientToken) {
  console.error('');
  console.error('ERROR: Missing required environment variables.');
  console.error('  Set API_URL and CLIENT_TOKEN in Vercel → Project → Settings → Environment Variables');
  console.error('');
  process.exit(1);
}

const content = `/**
 * Auto-generated at deploy time — do not edit on the server.
 * Source: Vercel environment variables API_URL and CLIENT_TOKEN.
 */
export const API_URL = ${JSON.stringify(apiUrl)};
export const CLIENT_TOKEN = ${JSON.stringify(clientToken)};
`;

const configPath = path.join(rootDir, 'js', 'config.js');
fs.writeFileSync(configPath, content, 'utf8');
console.log('Generated js/config.js from environment variables.');
