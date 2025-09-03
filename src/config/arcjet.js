const ARCJET_ENABLED = !!process.env.ARCJET_API_KEY;

let arcjetClient = null;

async function getClient() {
  if (!ARCJET_ENABLED) return null;
  if (arcjetClient) return arcjetClient;
  try {
    const mod = await import('@arcjet/node');
    const arcjet = mod.default || mod;
    arcjetClient = arcjet({
      apiKey: process.env.ARCJET_API_KEY,
      environment: process.env.ARCJET_ENV || process.env.NODE_ENV || 'development',
    });
    return arcjetClient;
  } catch {
    return null;
  }
}

export function botProtection() {
  return async (req, res, next) => {
    const client = await getClient();
    if (!client) return next();
    try {
      if (client.bot && typeof client.bot.protect === 'function') {
        const mw = client.bot.protect();
        return mw(req, res, next);
      }
      return next();
    } catch {
      return next();
    }
  };
}

export function globalShield() {
  const countries = (process.env.ARCJET_BLOCK_COUNTRIES || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return async (req, res, next) => {
    const client = await getClient();
    if (!client) return next();
    try {
      if (client.shield && typeof client.shield.enforce === 'function') {
        const mw = client.shield.enforce({
          block: {
            reputation: true,
            countries,
          },
        });
        return mw(req, res, next);
      }
      return next();
    } catch {
      return next();
    }
  };
}

export function rateLimitPerRoute(rpm) {
  const limit = Number(rpm || process.env.ARCJET_RPM_DEFAULT || 120);
  return async (req, res, next) => {
    const client = await getClient();
    if (!client) return next();
    try {
      if (client.rateLimit && typeof client.rateLimit.fixedWindow === 'function') {
        const mw = client.rateLimit.fixedWindow({
          limit,
          window: '1m',
          key: r => r.ip,
        });
        return mw(req, res, next);
      }
      return next();
    } catch {
      return next();
    }
  };
}

export function rateLimitAuth() {
  const limit = Number(process.env.ARCJET_RPM_AUTH || 10);
  return rateLimitPerRoute(limit);
}

export function getRequesterId(req) {
  return (req.user && (req.user.id || req.user._id)) || req.ip || 'anonymous';
}

export function rateLimitPerUser() {
  const limit = Number(process.env.ARCJET_RPM_USER || 60);
  return async (req, res, next) => {
    const client = await getClient();
    if (!client) return next();
    try {
      if (client.rateLimit && typeof client.rateLimit.slidingWindow === 'function') {
        const mw = client.rateLimit.slidingWindow({
          limit,
          window: '1m',
          key: r => getRequesterId(r),
        });
        return mw(req, res, next);
      }
      return next();
    } catch {
      return next();
    }
  };
}

export function sensitiveDetector() {
  const action = (process.env.ARCJET_SENSITIVE_MODE || 'block').toLowerCase();
  const categories = ['secrets', 'credentials', 'pii'];
  return async (req, res, next) => {
    const client = await getClient();
    if (!client) return next();
    try {
      if (client.sensitive && typeof client.sensitive.detect === 'function') {
        const mw = client.sensitive.detect({
          action,
          categories,
          text: r => {
            try {
              return JSON.stringify(r.body ?? {});
            } catch {
              return '';
            }
          },
        });
        return mw(req, res, next);
      }
      return next();
    } catch {
      return next();
    }
  };
}
