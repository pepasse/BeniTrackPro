import crypto from 'crypto';

const KEY_PREFIX = 'btp_';
const PREFIX_DISPLAY_LENGTH = 12; // ex: "btp_a1b2c3d4" — sert à retrouver la clé rapidement en base

export interface GeneratedApiKey {
  plainKey: string; // affichée UNE SEULE FOIS à la création, jamais stockée telle quelle
  keyPrefix: string;
  keyHash: string;
}

export const generateApiKey = (): GeneratedApiKey => {
  const randomPart = crypto.randomBytes(24).toString('base64url');
  const plainKey = `${KEY_PREFIX}${randomPart}`;
  const keyPrefix = plainKey.slice(0, PREFIX_DISPLAY_LENGTH);
  const keyHash = hashApiKey(plainKey);
  return { plainKey, keyPrefix, keyHash };
};

export const hashApiKey = (plainKey: string): string => {
  return crypto.createHash('sha256').update(plainKey).digest('hex');
};

export const extractKeyPrefix = (plainKey: string): string => plainKey.slice(0, PREFIX_DISPLAY_LENGTH);

// Comparaison en temps constant pour éviter les attaques par mesure de timing
export const secureCompare = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};
