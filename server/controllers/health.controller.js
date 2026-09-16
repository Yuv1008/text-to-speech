import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

const startedAt = Date.now();

export function getHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    provider: process.env.TTS_PROVIDER || 'mock',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    version,
  });
}
