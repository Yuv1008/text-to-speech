import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';

import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import healthRoutes from './routes/health.routes.js';
import historyRoutes from './routes/history.routes.js';
import ttsRoutes from './routes/tts.routes.js';
import voicesRoutes from './routes/voices.routes.js';
import { audioFileExists, audioFilePath } from './utils/audioStore.js';
import { startJanitor } from './utils/janitor.js';
import { requestLogger } from './utils/logger.js';

// .env lives at the project root (shared with the client, see client/vite.config.js).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5050;

const MIME_BY_EXT = { wav: 'audio/wav', mp3: 'audio/mpeg' };
// uuid.ext — nothing else is a valid audio filename, which also rules out path traversal.
const AUDIO_FILENAME_RE = /^[0-9a-f-]{36}\.(wav|mp3)$/i;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  }),
);
app.use(express.json());
app.use(requestLogger);

// Generated audio. Inline by default (so <audio> can play it directly); pass
// ?download=1 to get it back as an attachment with a readable filename.
app.get('/audio/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    if (!AUDIO_FILENAME_RE.test(filename) || !(await audioFileExists(filename))) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'That audio file no longer exists.' },
      });
    }
    const ext = filename.split('.').pop().toLowerCase();
    res.type(MIME_BY_EXT[ext] || 'application/octet-stream');
    if (req.query.download) {
      const suggestedName =
        typeof req.query.download === 'string' && req.query.download.trim()
          ? req.query.download
          : filename;
      res.set('Content-Disposition', `attachment; filename="${suggestedName}"`);
    } else {
      res.set('Content-Disposition', 'inline');
    }
    res.sendFile(audioFilePath(filename));
  } catch (err) {
    next(err);
  }
});

app.use('/api/health', healthRoutes);
app.use('/api/voices', voicesRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/history', historyRoutes);

app.use(notFound);
app.use(errorHandler);

startJanitor();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on port ${PORT} (provider: ${process.env.TTS_PROVIDER || 'mock'})`);
});
