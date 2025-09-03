import arcjet, {
  shield,
  detectBot,
  tokenBucket,
  sensitiveInfo,
} from '@arcjet/node';

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({
      mode: 'LIVE',
      allow: [
        'CATEGORY:SEARCH_ENGINE', // Google, Bing, etc
      ],
    }),
    tokenBucket({
      mode: 'LIVE',
      refillRate: 10,
      interval: 60, // 1 minute
      capacity: 20,
    }),
    sensitiveInfo({
      mode: 'LIVE',
      allow: [], // Block all sensitive info by default
    }),
  ],
});

export const authProtection = aj.withRule(
  tokenBucket({
    mode: 'LIVE',
    refillRate: 3, // Stricter rate limiting for auth endpoints
    interval: 60,
    capacity: 5,
  })
);

export const adminProtection = aj.withRule(
  tokenBucket({
    mode: 'LIVE',
    refillRate: 5,
    interval: 60,
    capacity: 10,
  })
);

export default aj;
