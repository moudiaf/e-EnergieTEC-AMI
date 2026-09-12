import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════
// Pure DES Engine (FIPS PUB 46-3 / IEC 62055-41 STS)
// ═══════════════════════════════════════════════════════════════════

const IP = [
  58, 50, 42, 34, 26, 18, 10, 2,
  60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6,
  64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17,  9, 1,
  59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5,
  63, 55, 47, 39, 31, 23, 15, 7
];

const FP = [
  40, 8, 48, 16, 56, 24, 64, 32,
  39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30,
  37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28,
  35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26,
  33, 1, 41,  9, 49, 17, 57, 25
];

const E = [
  32,  1,  2,  3,  4,  5,
   4,  5,  6,  7,  8,  9,
   8,  9, 10, 11, 12, 13,
  12, 13, 14, 15, 16, 17,
  16, 17, 18, 19, 20, 21,
  20, 21, 22, 23, 24, 25,
  24, 25, 26, 27, 28, 29,
  28, 29, 30, 31, 32,  1
];

const P = [
  16,  7, 20, 21, 29, 12, 28, 17,
   1, 15, 23, 26,  5, 18, 31, 10,
   2,  8, 24, 14, 32, 27,  3,  9,
  19, 13, 30,  6, 22, 11,  4, 25
];

const S = [
  [
    14,  4, 13,  1,  2, 15, 11,  8,  3, 10,  6, 12,  5,  9,  0,  7,
     0, 15,  7,  4, 14,  2, 13,  1, 10,  6, 12, 11,  9,  5,  3,  8,
     4,  1, 14,  8, 13,  6,  2, 11, 15, 12,  9,  7,  3, 10,  5,  0,
    15, 12,  8,  2,  4,  9,  1,  7,  5, 11,  3, 14, 10,  0,  6, 13
  ],
  [
    15,  1,  8, 14,  6, 11,  3,  4,  9,  7,  2, 13, 12,  0,  5, 10,
     3, 13,  4,  7, 15,  2,  8, 14, 12,  0,  1, 10,  6,  9, 11,  5,
     0, 14,  7, 11, 10,  4, 13,  1,  5,  8, 12,  6,  9,  3,  2, 15,
    13,  8, 10,  1,  3, 15,  4,  2, 11,  6,  7, 12,  0,  5, 14,  9
  ],
  [
    10,  0,  9, 14,  6,  3, 15,  5,  1, 13, 12,  7, 11,  4,  2,  8,
    13,  7,  0,  9,  3,  4,  6, 10,  2,  8,  5, 14, 12, 11, 15,  1,
    13,  6,  4,  9,  8, 15,  3,  0, 11,  1,  2, 12,  5, 10, 14,  7,
     1, 10, 13,  0,  6,  9,  8,  7,  4, 15, 14,  3, 11,  5,  2, 12
  ],
  [
     7, 13, 14,  3,  0,  6,  9, 10,  1,  2,  8,  5, 11, 12,  4, 15,
    13,  8, 11,  5,  6, 15,  0,  3,  4,  7,  2, 12,  1, 10, 14,  9,
    10,  6,  9,  0, 12, 11,  7, 13, 15,  1,  3, 14,  5,  2,  8,  4,
     3, 15,  0,  6, 10,  1, 13,  8,  9,  4,  5, 11, 12,  7,  2, 14
  ],
  [
     2, 12,  4,  1,  7, 10, 11,  6,  8,  5,  3, 15, 13,  0, 14,  9,
    14, 11,  2, 12,  4,  7, 13,  1,  5,  0, 15, 10,  3,  9,  8,  6,
     4,  2,  1, 11, 10, 13,  7,  8, 15,  9, 12,  5,  6,  3,  0, 14,
    11,  8, 12,  7,  1, 14,  2, 13,  6, 15,  0,  9, 10,  4,  5,  3
  ],
  [
    12,  1, 10, 15,  9,  2,  6,  8,  0, 13,  3,  4, 14,  7,  5, 11,
    10, 15,  4,  2,  7, 12,  9,  5,  6,  1, 13, 14,  0, 11,  3,  8,
     9, 14, 15,  5,  2,  8, 12,  3,  7,  0,  4, 10,  1, 13, 11,  6,
     4,  3,  2, 12,  9,  5, 15, 10, 11, 14,  1,  7,  6,  0,  8, 13
  ],
  [
     4, 11,  2, 14, 15,  0,  8, 13,  3, 12,  9,  7,  5, 10,  6,  1,
    13,  0, 11,  7,  4,  9,  1, 10, 14,  3,  5, 12,  2, 15,  8,  6,
     1,  4, 11, 13, 12,  3,  7, 14, 10, 15,  6,  8,  0,  5,  9,  2,
     6, 11, 13,  8,  1,  4, 10,  7,  9,  5,  0, 15, 14,  2,  3, 12
  ],
  [
    13,  2,  8,  4,  6, 15, 11,  1, 10,  9,  3, 14,  5,  0, 12,  7,
     1, 15, 13,  8, 10,  3,  7,  4, 12,  5,  6, 11,  0, 14,  9,  2,
     7, 11,  4,  1,  9, 12, 14,  2,  0,  6, 10, 13, 15,  3,  5,  8,
     2,  1, 14,  7,  4, 10,  8, 13, 15, 12,  9,  0,  3,  5,  6, 11
  ]
];

const PC1 = [
  57, 49, 41, 33, 25, 17,  9,
   1, 58, 50, 42, 34, 26, 18,
  10,  2, 59, 51, 43, 35, 27,
  19, 11,  3, 60, 52, 44, 36,
  63, 55, 47, 39, 31, 23, 15,
   7, 62, 54, 46, 38, 30, 22,
  14,  6, 61, 53, 45, 37, 29,
  21, 13,  5, 28, 20, 12,  4
];

const PC2 = [
  14, 17, 11, 24,  1,  5,
   3, 28, 15,  6, 21, 10,
  23, 19, 12,  4, 26,  8,
  16,  7, 27, 20, 13,  2,
  41, 52, 31, 37, 47, 55,
  30, 40, 51, 45, 33, 48,
  44, 49, 39, 56, 34, 53,
  46, 42, 50, 36, 29, 32
];

const SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

class PureDES {
  private subkeys: Uint8Array[] = [];

  constructor(keyBytes: Uint8Array) {
    const keyBits = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      const byteIdx = Math.floor(i / 8);
      const bitIdx = 7 - (i % 8);
      keyBits[i] = (keyBytes[byteIdx] >> bitIdx) & 1;
    }

    const c = new Uint8Array(28);
    const d = new Uint8Array(28);
    for (let i = 0; i < 28; i++) c[i] = keyBits[PC1[i] - 1];
    for (let i = 0; i < 28; i++) d[i] = keyBits[PC1[i + 28] - 1];

    this.subkeys = [];
    for (let round = 0; round < 16; round++) {
      const shift = SHIFTS[round];
      const newC = new Uint8Array(28);
      const newD = new Uint8Array(28);
      for (let i = 0; i < 28; i++) {
        newC[i] = c[(i + shift) % 28];
        newD[i] = d[(i + shift) % 28];
      }
      c.set(newC);
      d.set(newD);

      const cd = new Uint8Array(56);
      cd.set(c, 0);
      cd.set(d, 28);

      const subkey = new Uint8Array(48);
      for (let i = 0; i < 48; i++) {
        subkey[i] = cd[PC2[i] - 1];
      }
      this.subkeys.push(subkey);
    }
  }

  public encryptBlock(block8: Uint8Array): Uint8Array {
    const bits = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      bits[i] = (block8[Math.floor(i / 8)] >> (7 - (i % 8))) & 1;
    }

    const ipBits = new Uint8Array(64);
    for (let i = 0; i < 64; i++) ipBits[i] = bits[IP[i] - 1];

    let l = ipBits.subarray(0, 32);
    let r = ipBits.subarray(32, 64);

    for (let round = 0; round < 16; round++) {
      const subkey = this.subkeys[round];
      const er = new Uint8Array(48);
      for (let i = 0; i < 48; i++) er[i] = r[E[i] - 1];
      for (let i = 0; i < 48; i++) er[i] ^= subkey[i];

      const sOut = new Uint8Array(32);
      for (let box = 0; box < 8; box++) {
        const offset = box * 6;
        const row = (er[offset] << 1) | er[offset + 5];
        const col = (er[offset + 1] << 3) | (er[offset + 2] << 2) | (er[offset + 3] << 1) | er[offset + 4];
        const val = S[box][row * 16 + col];
        sOut[box * 4] = (val >> 3) & 1;
        sOut[box * 4 + 1] = (val >> 2) & 1;
        sOut[box * 4 + 2] = (val >> 1) & 1;
        sOut[box * 4 + 3] = val & 1;
      }

      const pOut = new Uint8Array(32);
      for (let i = 0; i < 32; i++) pOut[i] = sOut[P[i] - 1];

      const newR = new Uint8Array(32);
      for (let i = 0; i < 32; i++) newR[i] = l[i] ^ pOut[i];

      l = r;
      r = newR;
    }

    const rl = new Uint8Array(64);
    rl.set(r, 0);
    rl.set(l, 32);

    const outBits = new Uint8Array(64);
    for (let i = 0; i < 64; i++) outBits[i] = rl[FP[i] - 1];

    const outBytes = new Uint8Array(8);
    for (let i = 0; i < 64; i++) {
      outBytes[Math.floor(i / 8)] |= (outBits[i] << (7 - (i % 8)));
    }
    return outBytes;
  }

  public encryptOFB(plaintext: Uint8Array, iv8?: Uint8Array): Uint8Array {
    let iv = iv8 ? new Uint8Array(iv8) : new Uint8Array(8);
    const result = new Uint8Array(plaintext.length);

    let offset = 0;
    while (offset < plaintext.length) {
      iv = this.encryptBlock(iv);
      const chunkSize = Math.min(8, plaintext.length - offset);
      for (let i = 0; i < chunkSize; i++) {
        result[offset + i] = plaintext[offset + i] ^ iv[i];
      }
      offset += chunkSize;
    }
    return result;
  }
}

// ═══════════════════════════════════════════════════════════════════
// STS Engine Class
// ═══════════════════════════════════════════════════════════════════

export class StsEngine {
  private static BASE_DATE_1993 = new Date('1993-01-01T00:00:00Z').getTime();
  private static BASE_DATE_2014 = new Date('2014-01-01T00:00:00Z').getTime();

  // Vending Key Officielle RenTEC STS 2.0 KMS VAULT
  public static readonly DEFAULT_VK_HEX = 'ee115a7b09960e11';
  public static readonly DEFAULT_SGC = '600876';
  public static readonly DEFAULT_KRN = 2;

  public static calculateTID(baseYear: 1993 | 2014 = 1993): number {
    const base = baseYear === 2014 ? this.BASE_DATE_2014 : this.BASE_DATE_1993;
    const diffMs = Date.now() - base;
    return Math.floor(diffMs / 60000) & 0x00FFFFFF;
  }

  public static calculateCrc16(data: Uint8Array, len: number = data.length): number {
    let crc = 0xFFFF;
    for (let i = 0; i < len; i++) {
      crc ^= (data[i] << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return crc;
  }

  public static encodeAmount(kwh: number): number {
    const units = Math.round(kwh * 10);
    if (units < 16384) {
      return units & 0x3FFF;
    } else if (units < 16384 * 10) {
      const mantissa = Math.round(units / 10);
      return (mantissa & 0x3FFF) | (1 << 14);
    } else if (units < 16384 * 100) {
      const mantissa = Math.round(units / 100);
      return (mantissa & 0x3FFF) | (2 << 14);
    } else {
      const mantissa = Math.round(units / 1000);
      return (mantissa & 0x3FFF) | (3 << 14);
    }
  }

  /**
   * Dérivation DKGA02 (IEC 62055-41)
   */
  public static deriveDKGA02(vkHex: string, meterId: string, sgc: string, krn: number = 2): Buffer {
    const vkClean = vkHex.replace(/\s+/g, '').toLowerCase();
    const vkBytes = Buffer.from(vkClean.padStart(16, '0').substring(0, 16), 'hex');
    const des = new PureDES(vkBytes);

    const dkgb = Buffer.alloc(8);
    const s = sgc.replace(/\D/g, '').padStart(6, '0');
    dkgb[0] = parseInt(s.substring(0, 2), 16) || 0x60;
    dkgb[1] = parseInt(s.substring(2, 4), 16) || 0x08;
    dkgb[2] = parseInt(s.substring(4, 6), 16) || 0x76;
    dkgb[3] = krn & 0xFF;

    const p = meterId.replace(/\D/g, '').slice(-8).padStart(8, '0');
    for (let i = 0; i < 4; i++) {
      dkgb[4 + i] = parseInt(p.substring(i * 2, i * 2 + 2), 16) || 0;
    }

    const dk = des.encryptBlock(dkgb);
    return Buffer.from(dk);
  }

  public static generateCreditToken(params: {
    meterId: string;
    amountKwh: number;
    sgc?: string;
    krn?: number;
    masterKey?: string;
    tid?: number;
  }): {
    token: string;
    rawToken: string;
    tid: number;
    crc: number;
    kwh: number;
    dkHex: string;
  } {
    const sgc = params.sgc || this.DEFAULT_SGC;
    const vkHex = params.masterKey || process.env.MASTER_SGC_KEY || this.DEFAULT_VK_HEX;
    const krn = params.krn || this.DEFAULT_KRN;
    const tid = params.tid || this.calculateTID(1993);
    const amountVal = this.encodeAmount(params.amountKwh);
    const rnd = 0x05;

    // Bloc clair 66 bits (9 octets)
    const clearBytes = new Uint8Array(9);
    clearBytes[0] = ((0 & 0x03) << 6) | ((0 & 0x0F) << 2) | ((rnd >> 2) & 0x03);
    clearBytes[1] = ((rnd & 0x03) << 6) | ((tid >> 18) & 0x3F);
    clearBytes[2] = (tid >> 10) & 0xFF;
    clearBytes[3] = (tid >> 2) & 0xFF;
    clearBytes[4] = ((tid & 0x03) << 6) | ((amountVal >> 10) & 0x3F);
    clearBytes[5] = (amountVal >> 2) & 0xFF;
    clearBytes[6] = (amountVal & 0x03) << 6;

    const crc = this.calculateCrc16(clearBytes, 7);
    clearBytes[6] |= (crc >> 10) & 0x3F;
    clearBytes[7] = (crc >> 2) & 0xFF;
    clearBytes[8] = (crc & 0x03) << 6;

    // Dérivation DKGA02
    const dkBytes = this.deriveDKGA02(vkHex, params.meterId, sgc, krn);
    const dkDes = new PureDES(dkBytes);

    // Chiffrement DES-OFB
    const encrypted = dkDes.encryptOFB(clearBytes);

    let bigNum = BigInt(0);
    for (let i = 0; i < 9; i++) {
      bigNum = (bigNum << BigInt(8)) | BigInt(encrypted[i]);
    }
    bigNum = bigNum >> BigInt(6);

    let digits = bigNum.toString().padStart(20, '0');
    if (digits.length > 20) {
      digits = digits.slice(-20);
    }

    const formattedToken = digits.match(/.{1,4}/g)?.join('-') || digits;

    return {
      token: formattedToken,
      rawToken: digits,
      tid,
      crc,
      kwh: params.amountKwh,
      dkHex: dkBytes.toString('hex')
    };
  }
}
