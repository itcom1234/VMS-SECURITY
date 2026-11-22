import * as crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? '0123456789abcdef0123456789abcdef';
  return Buffer.from(raw.padEnd(32, '0').slice(0, 32));
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptSecret(stored: string): string {
  const [ivHex, tagHex, dataHex] = stored.split(':');
  const decipher = crypto.createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

export function buildRtspSource(
  rtspUrl: string,
  username?: string | null,
  passwordEnc?: string | null,
): string {
  if (!username) return rtspUrl;
  try {
    const url = new URL(rtspUrl);
    const password = passwordEnc ? decryptSecret(passwordEnc) : '';
    url.username = encodeURIComponent(username);
    url.password = encodeURIComponent(password);
    return url.toString();
  } catch {
    return rtspUrl;
  }
}