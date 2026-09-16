import { Router } from 'express';
import { getVoices } from '../controllers/voices.controller.js';
import { validate, voicesQuerySchema } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', validate(voicesQuerySchema, 'query'), asyncHandler(getVoices));

export default router;
