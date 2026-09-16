import { Router } from 'express';
import { postTts } from '../controllers/tts.controller.js';
import { ttsRateLimiter } from '../middleware/rateLimit.js';
import { ttsBodySchema, validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/', ttsRateLimiter, validate(ttsBodySchema, 'body'), asyncHandler(postTts));

export default router;
