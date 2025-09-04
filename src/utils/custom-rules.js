import {
  ArcjetRuleResult,
  ArcjetErrorReason,
  ArcjetReason,
} from '@arcjet/protocol';
import { webcrypto } from 'node:crypto';
import { fromError } from 'zod-validation-error';

class LocalDataValidation extends ArcjetReason {
  constructor(options = {}) {
    super();
    if (options.error) {
      this.error = options.error;
    }
  }
}

export function validateBody(options) {
  const ruleId = webcrypto.randomUUID();

  return [
    {
      version: 1,
      type: 'DATA_VALIDATION',
      mode: options.mode,
      priority: 0,
      validate(_context, _details) {
        
      },

      async protect(context, _details) {
        try {
          const body = await context.getBody();
          if (typeof body !== 'string') {
            return new ArcjetRuleResult({
              ruleId,
              ttl: 0,
              state: 'NOT_RUN',
              conclusion: 'ALLOW',
              reason: new LocalDataValidation({
                error: 'Missing body',
              }),
              fingerprint: context.fingerprint,
            });
          }

          const json = JSON.parse(body);
          const result = options.schema.safeParse(json);

          if (result.success) {
            return new ArcjetRuleResult({
              ruleId,
              ttl: 0,
              state: 'RUN',
              conclusion: 'ALLOW',
              reason: new LocalDataValidation(),
              fingerprint: context.fingerprint,
            });
          } else {
            return new ArcjetRuleResult({
              ruleId,
              ttl: 0,
              state: 'RUN',
              conclusion: 'DENY',
              reason: new LocalDataValidation({
                error: fromError(result.error).toString(),
              }),
              fingerprint: context.fingerprint,
            });
          }
        } catch (err) {
          return new ArcjetRuleResult({
            ruleId,
            ttl: 0,
            state: 'NOT_RUN',
            conclusion: 'ERROR',
            reason: new ArcjetErrorReason(err),
            fingerprint: context.fingerprint,
          });
        }
      },
    },
  ];
}
