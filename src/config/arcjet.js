const ARCJET_ENABLED = !!process.env.ARCJET_API_KEY;

let aj = null;
try {
  if (ARCJET_ENABLED) {
    const mod = await import('@arcjet/node');
    const arcjet = mod.default || mod;
    aj = arcjet({
      apiKey: process.env.ARCJET_API_KEY,
      environment: process.env.ARCJET_ENV || process.env.NODE_ENV || 'development',
    });
  }
} catch {
  aj = null;
}

const noop = (req, res, next) => next();

const countries = (process.env.ARCJET_BLOCK_COUNTRIES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const authLimit = Number(process.env.ARCJET_RPM_AUTH || 10);
const defaultRpm = Number(process.env.ARCJET_RPM_DEFAULT || 120);
const perUserLimit = Number(process.env.ARCJET_RPM_USER || 60);
const sensitiveAction = (process.env.ARCJET_SENSITIVE_MODE || 'block').toLowerCase();

function getRequesterId(req) {
  return (req.user && (req.user.id || req.user._id)) || req.ip || 'anonymous';
}

const cachedRouteLimiters = new Map();

const botMw =
  aj && aj.bot && typeof aj.bot.protect === 'function' ? aj.bot.protect() : noop;

let shieldMw = noop;
if (aj && aj.shield && typeof aj.shield.enforce === 'function') {
  shieldMw = aj.shield.enforce({
    block: {
      reputation: true,
      countries,
    },
  });
}

function limiterPerRoute(limit) {
  const lim = Number(limit || defaultRpm);
  const key = `route:${lim}`;
  if (cachedRouteLimiters.has(key)) return cachedRouteLimiters.get(key);
  let mw = noop;
  if (aj && aj.rateLimit && typeof aj.rateLimit.fixedWindow === 'function') {
    mw = aj.rateLimit.fixedWindow({
      limit: lim,
      window: '1m',
      key: (r) => r.ip,
    });
  }
  cachedRouteLimiters.set(key, mw);
  return mw;
}

const authLimiterMw = limiterPerRoute(authLimit);

let perUserLimiterMw = noop;
if (aj && aj.rateLimit && typeof aj.rateLimit.slidingWindow === 'function') {
  perUserLimiterMw = aj.rateLimit.slidingWindow({
    limit: perUserLimit,
    window: '1m',
    key: (r) => getRequesterId(r),
  });
}

let sensitiveMw = noop;
if (aj && aj.sensitive && typeof aj.sensitive.detect === 'function') {
  sensitiveMw = aj.sensitive.detect({
    action: sensitiveAction,
    categories: ['secrets', 'credentials', 'pii'],
    text: (r) => {
      try {
        return JSON.stringify(r.body ?? {});
      } catch {
        return '';
      }
    },
  });
}

export function botProtection() {
  return botMw;
}

export function globalShield() {
  return shieldMw;
}

export function rateLimitPerRoute(rpm) {
  return limiterPerRoute(rpm);
}

export function rateLimitAuth() {
  return authLimiterMw;
}

export function rateLimitPerUser() {
  return perUserLimiterMw;
}

export function sensitiveDetector() {
  return sensitiveMw;
}

export { aj as arcjetClient };
