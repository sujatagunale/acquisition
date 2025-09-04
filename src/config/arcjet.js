import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';

if (!process.env.ARCJET_KEY) {
  throw new Error(
    'ARCJET_KEY environment variable is required. Sign up for your Arcjet key at https://app.arcjet.com'
  );
}

// Configure Arcjet with security rules.
const aj = arcjet({
  key: process.env.ARCJET_KEY || 'ajkey_01k3t9534deq3rs2eb96fgsd2k',
  rules: [
    shield({ mode: 'LIVE' }),
    // Create a bot detection rule
    detectBot({
      mode: 'LIVE', // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        // See the full list at https://arcjet.com/bot-list
        'CATEGORY:SEARCH_ENGINE', // Google, Bing, etc
        'CATEGORY:PREVIEW', // Link previews e.g. Slack, Discord
      ],
    }),
    // Create a token bucket rate limit. Other algorithms are supported.
    slidingWindow({
      mode: 'LIVE',
      interval: '2s', // Refill every 2 seconds
      max: 5, // Allow 5 requests per interval
    }),
  ],
});

export default aj;
