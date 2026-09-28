/**
 * Gerador de Código PIX Padrão BRCode (EMV / Banco Central do Brasil)
 * Compatível com todos os bancos brasileiros para a modalidade "PIX Copia e Cola"
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

// Cálculo CRC16-CCITT (Polinômio 0x1021, valor inicial 0xFFFF)
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
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, '') // remove caracteres especiais
    .toUpperCase()
    .trim()
    .slice(0, maxLength);
}

export function generatePixBrcode(params: PixPayloadParams): string {
  let cleanKey = params.pixKey.trim();

  // Limpeza da chave dependendo do tipo
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

  // 1. Merchant Account Information (Tag 26)
  // Subtag 00: GUI ("br.gov.bcb.pix")
  // Subtag 01: Chave PIX
  // Subtag 02: Descrição (opcional)
  let subTag26 = formatEmv('00', 'br.gov.bcb.pix') + formatEmv('01', cleanKey);
  if (params.description) {
    const cleanDesc = normalizeText(params.description, 40);
    if (cleanDesc) subTag26 += formatEmv('02', cleanDesc);
  }
  const tag26 = formatEmv('26', subTag26);

  // 2. Montagem do payload EMV
  let payload = '';
  payload += formatEmv('00', '01'); // Payload Format Indicator
  payload += tag26; // Informações da conta PIX
  payload += formatEmv('52', '0000'); // Merchant Category Code
  payload += formatEmv('53', '986'); // Transaction Currency (986 = BRL)

  if (amountStr) {
    payload += formatEmv('54', amountStr); // Transaction Amount
  }

  payload += formatEmv('58', 'BR'); // Country Code
  payload += formatEmv('59', name); // Merchant Name
  payload += formatEmv('60', city); // Merchant City

  // Tag 62: Additional Data Field (TXID)
  const tag62 = formatEmv('62', formatEmv('05', txid));
  payload += tag62;

  // Tag 63: CRC16
  payload += '6304';
  const checksum = calculateCRC16(payload);

  return `${payload}${checksum}`;
}
