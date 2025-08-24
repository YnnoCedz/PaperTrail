// /server/utils/hash.js
import crypto from 'crypto';

export const sha256 = (text) =>
  crypto.createHash('sha256').update(String(text)).digest('hex');

export const isSha256Hex = (v) =>
  typeof v === 'string' && /^[0-9a-f]{64}$/i.test(v);
