// Structured, dependency-free request/event logging. No stack traces or secrets ever
// go through here for anything that could reach a client-facing response.
function line(level, message, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? meta : {}),
  };
  const out = level === 'error' ? console.error : console.log;
  out(JSON.stringify(entry));
}

export const logger = {
  info: (message, meta) => line('info', message, meta),
  warn: (message, meta) => line('warn', message, meta),
  error: (message, meta) => line('error', message, meta),
};

// Express middleware: one structured line per request, with timing.
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info('request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
      ip: req.ip,
    });
  });
  next();
}
