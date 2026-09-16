import { Router } from 'express';
import {
  deleteAllHistory,
  deleteHistoryEntry,
  getHistory,
} from '../controllers/history.controller.js';
import { historyParamsSchema, historyQuerySchema, validate } from '../middleware/validate.js';

const router = Router();

router.get('/', validate(historyQuerySchema, 'query'), getHistory);
router.delete('/:id', validate(historyParamsSchema, 'params'), deleteHistoryEntry);
router.delete('/', deleteAllHistory);

export default router;
