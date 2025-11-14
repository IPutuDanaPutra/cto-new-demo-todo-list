import crypto from 'crypto';

export function generateCorrelationId(): string {
  return crypto.randomUUID();
}
