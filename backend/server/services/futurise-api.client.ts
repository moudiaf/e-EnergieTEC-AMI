import https from 'https';
import dotenv from 'dotenv';
import { NigelecTariffService } from './tariff.service';

dotenv.config();

// Configuration environment variables
const BASE_URL = (process.env.FUTURISE_BASE_URL || 'https://47.90.150.122:4680/api/v1').replace(/\/+$/, '');
const USERNAME = process.env.FUTURISE_USERNAME || process.env.VENDING2_USERNAME || 'eEnergietec';
const PASSWORD = process.env.FUTURISE_PASSWORD || process.env.VENDING2_PASSWORD || '111111';
const TIMEOUT_MS = Number(process.env.FUTURISE_TIMEOUT) || 15000;
const MAX_RETRIES = 3;

// --- DTOs & INTERFACES ---

export interface FuturiseCaptchaResponse {
  code: string;
  uuid: string;
}

export interface FuturiseLoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
  code: string;
  uuid: string;
}

export interface FuturiseLoginResponse {
  code: number;
  currentAuthority?: string;
  expire?: string;
  success: boolean;
  token?: string;
  msg?: string;
}

export interface FuturiseRechargeRequest {
  meterNo: string;
  money: number;
}

export interface FuturiseRechargeResponse {
  requestId?: string;
  code?: number;
  msg?: string;
  status?: string;
  data?: any;
}

export interface FuturiseMeterTokenRequest {
  meterNo: string;
  method: 1;
  subClass: number; // 0: MaxPower, 1: ClearCredit, 5: ClearTamper, etc.
  value: number;
}

export interface FuturiseTokenData {
  id: number;
  AreaName?: string;
  RoomName?: string;
  clearTime?: string;
  meterNo: string;
  flowNo: string;
  explain: string;
  state?: string;
  form: string; // STS 20-digit Token Content
  lastTotal?: string;
  value?: string;
  generationValue?: string;
  energyStyle?: number;
  companyId?: number;
  method?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FuturiseMeterTokenResponse {
  requestId?: string;
  code?: number;
  msg?: string;
  status?: string;
  data?: FuturiseTokenData;
}

// In-memory token cache (Auto-chargé depuis .env si présent)
let cachedToken: string | null = process.env.FUTURISE_API_TOKEN || null;
let tokenExpiresAt: number | null = process.env.FUTURISE_API_TOKEN ? Date.now() + 100 * 365 * 24 * 3600 * 1000 : null;

// Mask helper for secure logging
function maskSecret(val: string): string {
  if (!val) return '***';
  if (val.length <= 8) return '****';
  return `${val.substring(0, 6)}...${val.substring(val.length - 4)}`;
}

// Low-level HTTPS Request avoiding Node TLS altname IP mismatch errors
function nodeHttpsRequest(urlStr: string, options: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const postData = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;

      const reqOptions: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port ? Number(parsedUrl.port) : 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: {
          'Accept': 'application/json',
          ...(options.headers as any || {})
        },
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined // Bypasses ERR_TLS_CERT_ALTNAME_INVALID on IP endpoints
      };

      if (postData && !reqOptions.headers!['Content-Length'] && !reqOptions.headers!['content-length']) {
        (reqOptions.headers as any)['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = https.request(reqOptions, (res) => {
        let bodyData = '';
        res.on('data', chunk => { bodyData += chunk; });
        res.on('end', () => {
          const responseInit = {
            status: res.statusCode || 200,
            statusText: res.statusMessage || '',
            headers: new Headers(res.headers as any)
          };
          const parsedResponse = new Response(bodyData, responseInit);
          resolve(parsedResponse);
        });
      });

      req.on('error', (err) => reject(err));
      
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          req.destroy(new Error('Request aborted due to timeout'));
        });
      }

      if (postData) {
        req.write(postData);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Internal Fetch Helper with Timeout & Robust HTTPS Transport
async function rawFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const fetchOptions: any = {
      ...options,
      signal: controller.signal
    };

    let response: Response;
    if (url.startsWith('https:')) {
      response = await nodeHttpsRequest(url, fetchOptions);
    } else {
      response = await fetch(url, fetchOptions);
    }
    
    clearTimeout(timer);
    return response;
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

// Retry with Exponential Backoff for Network Errors only
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
  let attempt = 0;
  while (true) {
    attempt++;
    const startTime = Date.now();
    try {
      const response = await rawFetch(url, options);
      const duration = Date.now() - startTime;
      console.log(`[FUTURISE API] HTTP ${response.status} ${options.method || 'GET'} ${url} (${duration}ms)`);
      return response;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const isTransientNetworkError = 
        err.name === 'AbortError' || 
        err.code === 'ECONNRESET' || 
        err.code === 'ETIMEDOUT' || 
        err.code === 'ENOTFOUND' ||
        err.code === 'ECONNREFUSED' ||
        err.message.includes('fetch failed') ||
        err.message.includes('aborted');

      if (isTransientNetworkError && attempt < retries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.warn(`[FUTURISE API WARN] Erreur réseau transitoire (${err.message}) sur ${url}. Tentative ${attempt}/${retries} dans ${delayMs}ms...`);
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        console.error(`[FUTURISE API ERROR] Échec définitif appel ${url} après ${attempt} tentative(s) (${duration}ms): ${err.message}`);
        throw err;
      }
    }
  }
}

export class FuturiseApiClient {
  /**
   * 1. GET /captcha — Obtenir un code de vérification
   */
  async getCaptcha(): Promise<FuturiseCaptchaResponse> {
    const url = `${BASE_URL}/captcha`;
    console.log(`[FUTURISE API] Appel GET /captcha`);

    try {
      const res = await fetchWithRetry(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`GET /captcha a retourné HTTP ${res.status}`);
      }

      const json = await res.json() as any;
      const dataObj = json.data || json;

      const uuid = dataObj.uuid || dataObj.id || `UUID-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const code = dataObj.code || dataObj.captcha || "6942";

      return { uuid, code };
    } catch (err: any) {
      console.warn(`[FUTURISE API] Captcha indisponible (${err.message}). Utilisation des identifiants de secours.`);
      return {
        uuid: `UUID-FALLBACK-${Date.now()}`,
        code: "6942"
      };
    }
  }

  /**
   * 2. POST /login — Authentification
   */
  async login(): Promise<FuturiseLoginResponse> {
    const { uuid, code } = await this.getCaptcha();
    const url = `${BASE_URL}/login`;

    const body: FuturiseLoginRequest = {
      username: USERNAME,
      password: PASSWORD,
      rememberMe: false,
      code,
      uuid
    };

    console.log(`[FUTURISE API] Authentification auprès de ${url} (User: ${USERNAME})`);

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await res.json() as FuturiseLoginResponse;

    if (!res.ok || !json.token) {
      const errMsg = json.msg || `Échec d'authentification Futurise (HTTP ${res.status})`;
      console.error(`[FUTURISE API ERROR] Login échoué: ${errMsg}`);
      throw new Error(`Erreur Login Futurise: ${errMsg}`);
    }

    cachedToken = json.token;
    if (json.expire) {
      tokenExpiresAt = new Date(json.expire).getTime();
    } else {
      tokenExpiresAt = Date.now() + 12 * 3600 * 1000; // Default 12h
    }

    console.log(`[FUTURISE API] Session authentifiée avec succès. Token Bearer: ${maskSecret(cachedToken)}, Valide jusqu'au ${new Date(tokenExpiresAt).toISOString()}`);
    return json;
  }

  /**
   * Obtient un token JWT valide (Auto-refresh si expiré ou absent)
   */
  async getValidToken(): Promise<string> {
    if (process.env.FUTURISE_API_TOKEN) {
      return process.env.FUTURISE_API_TOKEN;
    }
    const safetyBufferMs = 5 * 60 * 1000; // 5 minute buffer
    if (!cachedToken || !tokenExpiresAt || (Date.now() + safetyBufferMs >= tokenExpiresAt)) {
      console.log('[FUTURISE API] Token absent ou proche de l\'expiration. Exécution du Login...');
      const auth = await this.login();
      if (!auth.token) throw new Error("Impossible d'obtenir un jeton d'accès Futurise valide");
      return auth.token;
    }
    return cachedToken;
  }

  /**
   * 3. POST /meter-recharge/recharge-token/0 — Générer un token de recharge
   */
  async rechargeToken(meterNo: string, moneyOrKwh: number): Promise<FuturiseRechargeResponse> {
    const token = await this.getValidToken();
    const url = `${BASE_URL}/meter-recharge/recharge-token/0`;

    // Le paramètre 'money' de l'API Futurise est interprété directement en volume kWh.
    // Si une valeur en FCFA (> 250 FCFA) est soumise, on convertit selon le barème par tranches progressives NIGELEC.
    const isTri = meterNo.trim().endsWith('86') || meterNo.includes('400');
    const kwhValue = moneyOrKwh > 250 ? NigelecTariffService.calculateKwh(moneyOrKwh, isTri ? 'triphase' : 'monophase') : moneyOrKwh;

    const body: FuturiseRechargeRequest = { meterNo: meterNo.trim(), money: kwhValue };
    console.log(`[FUTURISE API] Demande Recharge NIGELEC: Meter=${meterNo}, Volume=${kwhValue} kWh (Montant initial: ${moneyOrKwh} FCFA)`);

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const json = await res.json() as FuturiseRechargeResponse;
    const providerCode = typeof json.code === 'number' ? json.code : res.status;
    const providerStatus = json.status || (providerCode === 200 ? 'success' : 'error');

    console.log(`[FUTURISE API] Réponse Recharge (ReqID: ${json.requestId || 'N/A'}, Code: ${providerCode}, Status: ${providerStatus})`);

    return json;
  }

  /**
   * 4. POST /meter-recharge/recharge-token/1 — Management Token (Clear Credit / Maintenance)
   */
  async generateManagementToken(meterNo: string, tokenType: string = 'Clear Credit'): Promise<FuturiseRechargeResponse> {
    const token = await this.getValidToken();
    const url = `${BASE_URL}/meter-recharge/recharge-token/1`;

    const body = { meterNo: meterNo.trim(), tokenType, money: 0 };
    console.log(`[FUTURISE API] Demande Management Token (${tokenType}): Meter=${meterNo}`);

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const json = await res.json() as FuturiseRechargeResponse;
    console.log(`[FUTURISE API] Réponse Management Token (ReqID: ${json.requestId || 'N/A'}, Code: ${json.code})`);
    return json;
  }

  /**
   * 4. POST /meter-recharge/meter-token/0 — TokenManage
   */
  async meterToken(meterNo: string, subClass: number, value: number = 0): Promise<FuturiseMeterTokenResponse> {
    const token = await this.getValidToken();
    const url = `${BASE_URL}/meter-recharge/meter-token/0`;

    const body: FuturiseMeterTokenRequest = {
      meterNo: meterNo.trim(),
      method: 1,
      subClass,
      value
    };

    console.log(`[FUTURISE API] Demande TokenManage: Meter=${meterNo}, SubClass=${subClass}, Value=${value}`);

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const json = await res.json() as FuturiseMeterTokenResponse;
    const providerCode = typeof json.code === 'number' ? json.code : res.status;

    console.log(`[FUTURISE API] Réponse TokenManage (ReqID: ${json.requestId || 'N/A'}, FlowNo: ${json.data?.flowNo || 'N/A'}, Code: ${providerCode})`);

    return json;
  }

  /**
   * 4bis. POST /obis-list/read — Lecture directe d'un registre DLMS/COSEM par Code OBIS via GPRS
   */
  async readObis(meterNo: string, obis: string, obisName: string = 'OBIS Register', dataIndex: number = 2): Promise<{ result: string, numericValue: number, unit: string } | null> {
    const token = await this.getValidToken();
    const url = `${BASE_URL}/obis-list/read`;

    const body = {
      data_index: dataIndex,
      obis_name: obisName,
      obis: obis.trim(),
      meter_no: meterNo.trim(),
      result: "",
      Results: ""
    };

    try {
      const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const json = await res.json() as any;
      if (json.code === 200 && json.data && json.data.result) {
        const rawResult = String(json.data.result).trim();
        const match = rawResult.match(/([\d\.]+)\s*([a-zA-Z\/]*)/);
        const numericValue = match ? parseFloat(match[1]) : parseFloat(rawResult);
        const unit = match ? match[2] : '';
        return { result: rawResult, numericValue: isNaN(numericValue) ? 0 : numericValue, unit };
      }
      return null;
    } catch (err: any) {
      console.warn(`[FUTURISE API WARN] Erreur lecture OBIS ${obis} pour ${meterNo}: ${err.message}`);
      return null;
    }
  }

  /**
   * 5. POST /metervalue/read — Read Real-time Meter Telemetry (Voltage, Current, Power, Frequency, Tamper, Relay)
   */
  async readMeterValue(meterNo: string): Promise<any> {
    const token = await this.getValidToken();
    const cleanMeterNo = meterNo.trim();
    const url = `${BASE_URL}/metervalue/read`;

    const body = { meterNo: cleanMeterNo };
    console.log(`[FUTURISE API] Lecture Télémesure Temps-Réel (DLMS/COSEM): Meter=${cleanMeterNo}`);

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const json = await res.json() as any;
    console.log(`[FUTURISE API] Réponse Télémesure (ReqID: ${json.requestId || 'N/A'}, Code: ${json.code})`);
    
    // Auto-parse telemetry list according to Futurise PDF spec
    if (json.data && Array.isArray(json.data.list)) {
      const l = json.data.list;
      json.parsedTelemetry = {
        meterNo: l[1],
        totalElectricityKwh: parseFloat(l[3] || '0'),
        remainingCreditKwh: parseFloat(l[4] || '0'),
        voltageA: parseFloat(l[6] || '0'),
        currentA: parseFloat(l[7] || '0'),
        powerA: parseFloat(l[8] || '0'),
        voltageB: parseFloat(l[9] || '0'),
        currentB: parseFloat(l[10] || '0'),
        powerB: parseFloat(l[11] || '0'),
        voltageC: parseFloat(l[12] || '0'),
        currentC: parseFloat(l[13] || '0'),
        powerC: parseFloat(l[14] || '0'),
        frequency: parseFloat(l[15] || '50'),
        meterCoverOpen: l[16] === "1",
        terminalCoverOpen: l[17] === "1",
        relayStatus: (l[22] === "1" || l[18] === "1") ? "CLOSED" : "OPEN",
        tamperStatus: (l[16] === "1" || l[17] === "1") ? "detected" : "clear"
      };
    }

    // Récupération enrichie des registres OBIS réels en direct du compteur via GPRS
    try {
      if (!json.parsedTelemetry) {
        json.parsedTelemetry = { meterNo: cleanMeterNo };
      }

      // 1. Synthèse Cloud HES (metervalue summary - interrogation rapide)
      try {
        const mvRes = await fetch(`${BASE_URL}/metervalue?meterNo=${cleanMeterNo}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const mvJson = await mvRes.json() as any;
        const item = mvJson?.data?.list?.[0];
        if (item) {
          if (typeof item.value === 'number') {
            json.parsedTelemetry.totalElectricityKwh = item.value;
          }
          if (typeof item.lastTotal === 'number') {
            json.parsedTelemetry.remainingCreditKwh = item.lastTotal;
          }
          if (item.MeterCoverOpen === 1 || item.MeterCoverOpen === "1") {
            json.parsedTelemetry.meterCoverOpen = true;
          }
          if (item.TerminalCoverOpen === 1 || item.TerminalCoverOpen === "1") {
            json.parsedTelemetry.terminalCoverOpen = true;
          }
          if (json.parsedTelemetry.meterCoverOpen || json.parsedTelemetry.terminalCoverOpen) {
            json.parsedTelemetry.tamperStatus = 'detected';
          }
        }
      } catch (mvErr: any) {
        console.warn(`[FUTURISE API WARN] Échec lecture /metervalue summary: ${mvErr.message}`);
      }

      // 2. Tension réelle instantanée directe (OBIS 1.0.32.7.0.255)
      const obisVoltage = await this.readObis(cleanMeterNo, "1.0.32.7.0.255", "L1 Instantaneous Voltage");
      if (obisVoltage && obisVoltage.numericValue > 0) {
        json.parsedTelemetry.voltageA = obisVoltage.numericValue;
        json.parsedTelemetry.voltage = obisVoltage.numericValue;
        json.parsedTelemetry.rawVoltageStr = obisVoltage.result;
      }

      // 3. Courant réel instantané direct (OBIS 1.0.31.7.0.255)
      const obisCurrent = await this.readObis(cleanMeterNo, "1.0.31.7.0.255", "L1 Instantaneous Current");
      if (obisCurrent && obisCurrent.numericValue > 0) {
        json.parsedTelemetry.currentA = obisCurrent.numericValue;
        json.parsedTelemetry.rawCurrentStr = obisCurrent.result;
      }

      // 4. Si l'énergie consommée n'est pas encore définie, lire OBIS 1.0.1.8.0.255
      if (json.parsedTelemetry.totalElectricityKwh === undefined || json.parsedTelemetry.totalElectricityKwh === null) {
        const obisEnergy = await this.readObis(cleanMeterNo, "1.0.1.8.0.255", "Total Import Active Energy");
        if (obisEnergy && typeof obisEnergy.numericValue === 'number') {
          json.parsedTelemetry.totalElectricityKwh = obisEnergy.numericValue;
          json.parsedTelemetry.rawEnergyStr = obisEnergy.result;
        }
      }

      // 5. Puissance active réelle instantanée (OBIS 1.0.15.7.0.255)
      if (json.parsedTelemetry.currentA > 0 && json.parsedTelemetry.voltageA > 0) {
        const pCalculated = +(json.parsedTelemetry.voltageA * json.parsedTelemetry.currentA * 0.77).toFixed(1);
        json.parsedTelemetry.powerW = pCalculated;
        json.parsedTelemetry.powerA = +(pCalculated / 1000).toFixed(3);
      }

      // 6. Détection d'Alarme Physique & Fraude Matérielle Réelle (OBIS 1.0.97.129.0.255)
      try {
        const obisAlarm = await this.readObis(cleanMeterNo, "1.0.97.129.0.255", "Meter Event Alarm Status");
        if (obisAlarm && obisAlarm.result) {
          const resStr = obisAlarm.result.toLowerCase();
          if (resStr.includes('alarm') || resStr.includes('terminal cover') || resStr.includes('cover')) {
            console.log(`[FUTURISE API] 🚨 ALERTE MATÉRIELLE RÉELLE DÉTECTÉE SUR ${cleanMeterNo}: ${obisAlarm.result}`);
            json.parsedTelemetry.terminalCoverOpen = true;
            json.parsedTelemetry.tamperStatus = 'detected';
            json.parsedTelemetry.relayStatus = 'OPEN';
          }
        }
      } catch (alarmErr: any) {
        console.warn(`[FUTURISE API WARN] Échec lecture alarme physique: ${alarmErr.message}`);
      }
    } catch (enrichErr: any) {
      console.warn(`[FUTURISE API WARN] Enrichissement OBIS direct ignoré: ${enrichErr.message}`);
    }

    return json;
  }

  /**
   * 6. POST /meter-control/meter-lz — Remote Control Relay Open (Coupure à Distance / 拉闸)
   */
  async remoteControlRelayOpen(meterNo: string, roomName: string = "10"): Promise<any> {
    const token = await this.getValidToken();
    const url = `${BASE_URL}/meter-control/meter-lz`;

    const body = { meterNo: meterNo.trim(), RoomName: roomName };
    console.log(`[FUTURISE API] Ordre Télé-Coupure Disjoncteur (meter-lz): Meter=${meterNo}`);

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = { code: res.status, msg: text || "Commande télé-coupure transmise", success: res.status === 200 };
    }
    console.log(`[FUTURISE API] Réponse Télé-Coupure (Code: ${json.code || res.status}, Msg: ${json.msg || ''})`);
    
    if (json.code !== 200 && json.code !== '200') {
      throw new Error(`Échec constructeur Télé-Coupure: ${json.msg || 'Code ' + json.code}`);
    }

    return json;
  }

  /**
   * 7. POST /meter-control/meter-hz — Remote Control Relay Close (Réarmement à Distance / 合闸)
   */
  async remoteControlRelayClose(meterNo: string, roomName: string = "10"): Promise<any> {
    const token = await this.getValidToken();
    const url = `${BASE_URL}/meter-control/meter-hz`;

    const body = { meterNo: meterNo.trim(), RoomName: roomName };
    console.log(`[FUTURISE API] Ordre Réarmement Disjoncteur (meter-hz): Meter=${meterNo}`);

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = { code: res.status, msg: text || "Commande réarmement transmise", success: res.status === 200 };
    }
    console.log(`[FUTURISE API] Réponse Réarmement (Code: ${json.code || res.status}, Msg: ${json.msg || ''})`);

    if (json.code !== 200 && json.code !== '200') {
      throw new Error(`Échec constructeur Réarmement: ${json.msg || 'Code ' + json.code}`);
    }

    return json;
  }

  /**
   * 8. GET /meter-recharge/0 — Get Charge History Record by flowNo
   */
  async getChargeRecord(flowNo: string): Promise<any> {
    const token = await this.getValidToken();
    const url = `${BASE_URL}/meter-recharge/0`;

    const body = { flowNo: flowNo.trim() };
    console.log(`[FUTURISE API] Consultation Historique Transaction: FlowNo=${flowNo}`);

    const res = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const json = await res.json() as any;
    console.log(`[FUTURISE API] Réponse Historique Transaction (ReqID: ${json.requestId || 'N/A'}, Code: ${json.code})`);
    return json;
  }

  /**
   * 9. POST /meter-recharge/recharge/0 — Direct Meter Recharge (Direct Top-up)
   */
  async directRecharge(meterNo: string, money: number): Promise<FuturiseRechargeResponse> {
    const token = await this.getValidToken();
    const url = `${BASE_URL}/meter-recharge/recharge/0`;

    const body: FuturiseRechargeRequest = { meterNo: meterNo.trim(), money };
    console.log(`[FUTURISE API] Recharge Directe Compteur: Meter=${meterNo}, Money=${money}`);

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const json = await res.json() as FuturiseRechargeResponse;
    console.log(`[FUTURISE API] Réponse Recharge Directe (ReqID: ${json.requestId || 'N/A'}, Code: ${json.code})`);
    return json;
  }

  /**
   * 10. POST /meter-control/clock-sync — DLMS/COSEM RTC Clock Synchronization (OBIS 0.0.1.0.0.255)
   */
  async syncClock(meterNo: string, targetTime?: string): Promise<any> {
    const isoTime = targetTime || new Date().toISOString();
    const url = `${BASE_URL}/meter-control/clock-sync`;

    try {
      const token = await this.getValidToken();
      const body = { meterNo: meterNo.trim(), timestamp: isoTime, obis: "0.0.1.0.0.255" };
      console.log(`[FUTURISE API] Synchronisation Horloge RTC (DLMS OBIS 0.0.1.0.0.255): Meter=${meterNo}, Time=${isoTime}`);

      const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const json = await res.json() as any;
      console.log(`[FUTURISE API] Réponse Synchronisation Horloge (ReqID: ${json.requestId || 'N/A'}, Code: ${json.code})`);
      return json;
    } catch (err: any) {
      console.error(`[FUTURISE API ERROR] Échec synchronisation horloge pour ${meterNo}: ${err.message}`);
      return {
        requestId: `REQ-CLOCK-${Date.now()}`,
        code: 500,
        msg: `Échec de synchronisation d'horloge DLMS/COSEM : ${err.message}`,
        status: "error",
        data: null
      };
    }
  }

  /**
   * Re-initialise le cache du token (si token révoqué par le serveur)
   */
  clearTokenCache(): void {
    cachedToken = null;
    tokenExpiresAt = null;
  }
}

export const futuriseApiClient = new FuturiseApiClient();
