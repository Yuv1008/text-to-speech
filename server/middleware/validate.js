import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../services/tts/voices.catalog.js';
import { AppError } from '../utils/errors.js';

const MAX_TEXT_LENGTH = Number(process.env.MAX_TEXT_LENGTH) || 1000;

// Fields that don't carry an explicit error code in a zod issue (a wrong type,
// a missing required field) fall back to the closest code for that field —
// still a 400, never a bare "validation failed".
const FIELD_FALLBACK_CODE = {
  text: 'EMPTY_TEXT',
  language: 'UNSUPPORTED_LANGUAGE',
  voice: 'INVALID_VOICE',
  rate: 'INVALID_RATE',
  pitch: 'INVALID_PITCH',
};

export const ttsBodySchema = z
  .object({
    text: z.string().default('').transform((t) => t.trim()),
    language: z.string().default(''),
    voice: z.string().min(1, 'A voice is required.').default(''),
    rate: z.coerce.number().optional().default(1.0),
    pitch: z.coerce.number().optional().default(0),
    format: z.enum(['mp3', 'wav']).catch('mp3'),
  })
  .superRefine((data, ctx) => {
    if (data.text.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['text'],
        message: 'Text is required.',
        params: { code: 'EMPTY_TEXT' },
      });
    } else if (data.text.length > MAX_TEXT_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['text'],
        message: `Text must be ${MAX_TEXT_LENGTH} characters or fewer.`,
        params: { code: 'TEXT_TOO_LONG' },
      });
    }
    if (!SUPPORTED_LANGUAGES.includes(data.language)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['language'],
        message: `"${data.language}" is not a supported language.`,
        params: { code: 'UNSUPPORTED_LANGUAGE' },
      });
    }
    if (data.rate < 0.5 || data.rate > 2.0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rate'],
        message: 'Rate must be between 0.5 and 2.0.',
        params: { code: 'INVALID_RATE' },
      });
    }
    if (data.pitch < -10 || data.pitch > 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pitch'],
        message: 'Pitch must be between -10 and 10.',
        params: { code: 'INVALID_PITCH' },
      });
    }
  });

export const voicesQuerySchema = z.object({
  language: z
    .string()
    .optional()
    .refine((lang) => !lang || SUPPORTED_LANGUAGES.includes(lang), {
      message: 'Unsupported language.',
      params: { code: 'UNSUPPORTED_LANGUAGE' },
    }),
});

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().catch(20),
});

export const historyParamsSchema = z.object({
  id: z.string().min(1),
});

/**
 * Validates req[source] against `schema`. On failure, raises an AppError with
 * the first issue's business code (or the field's fallback code) — the server
 * never trusts client input past this point.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.join('.') || undefined;
      const code = issue.params?.code || FIELD_FALLBACK_CODE[field] || 'INTERNAL';
      return next(new AppError(code, issue.message, { field }));
    }
    req[source] = result.data;
    next();
  };
}
