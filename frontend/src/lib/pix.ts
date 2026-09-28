/**
 * Gerador de Código PIX Padrão BRCode (EMV / Banco Central do Brasil)
 */

export interface PixPayloadParams {
  pixKey: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid?: string;
  description?: string;
}

function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatEmv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function normalizeText(text: string, maxLength: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, maxLength);
}

export function generatePixBrcode(params: PixPayloadParams): string {
  if (!params.pixKey) return '';

  let cleanKey = params.pixKey.trim();

  if (params.pixKeyType === 'cpf' || params.pixKeyType === 'cnpj') {
    cleanKey = cleanKey.replace(/\D/g, '');
  } else if (params.pixKeyType === 'phone') {
    cleanKey = cleanKey.replace(/\D/g, '');
    if (!cleanKey.startsWith('+')) {
      if (!cleanKey.startsWith('55') && (cleanKey.length === 10 || cleanKey.length === 11)) {
        cleanKey = '+55' + cleanKey;
      } else if (!cleanKey.startsWith('+')) {
        cleanKey = '+' + cleanKey;
      }
    }
  }

  const name = normalizeText(params.merchantName || 'BENEFICIARIO', 25) || 'BENEFICIARIO';
  const city = normalizeText(params.merchantCity || 'SAO PAULO', 15) || 'SAO PAULO';
  const amountStr = params.amount > 0 ? params.amount.toFixed(2) : '';
  const txid = normalizeText(params.txid || '***', 25) || '***';

  let subTag26 = formatEmv('00', 'br.gov.bcb.pix') + formatEmv('01', cleanKey);
  if (params.description) {
    const cleanDesc = normalizeText(params.description, 40);
    if (cleanDesc) subTag26 += formatEmv('02', cleanDesc);
  }
  const tag26 = formatEmv('26', subTag26);

  let payload = '';
  payload += formatEmv('00', '01');
  payload += tag26;
  payload += formatEmv('52', '0000');
  payload += formatEmv('53', '986');

  if (amountStr) {
    payload += formatEmv('54', amountStr);
  }

  payload += formatEmv('58', 'BR');
  payload += formatEmv('59', name);
  payload += formatEmv('60', city);

  const tag62 = formatEmv('62', formatEmv('05', txid));
  payload += tag62;

  payload += '6304';
  const checksum = calculateCRC16(payload);

  return `${payload}${checksum}`;
}

export function getQrCodeImageUrl(payload: string, size = 250): string {
  if (!payload) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`;
}
