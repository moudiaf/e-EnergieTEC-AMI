import { db, isEnterpriseMode } from '../db';
import { NigelecTariffService } from './tariff.service';
import { auditService } from './audit.service';
import { futuriseApiClient } from './futurise-api.client';
import dotenv from 'dotenv';

dotenv.config();

export const vending2Service = {
  /**
   * 1. GET /captcha (via FuturiseApiClient)
   */
  async getCaptcha() {
    return futuriseApiClient.getCaptcha();
  },

  /**
   * 2. POST /login (via FuturiseApiClient)
   */
  async login() {
    return futuriseApiClient.login();
  },

  /**
   * Obtient un token valide (auto-login avant expiration)
   */
  async getValidToken() {
    return futuriseApiClient.getValidToken();
  },

  /**
   * 3. POST /meter-recharge/recharge-token/0
   * Effectue la recharge d'un compteur via Futurise / Vending2 API
   */
  async rechargeMeter(meterNo: string, money: number, operatorUser: string = 'SYSTEM', customerId?: string) {
    if (!meterNo || !meterNo.trim()) throw new Error("Numéro de compteur requis");
    if (money <= 0) throw new Error("Le montant de la recharge doit être supérieur à 0");

    const cleanMeterNo = meterNo.trim();
    const nowIso = new Date().toISOString();

    // Vérifier l'existence du compteur dans QPLAT HES
    const meterRecord = await db.prepare("SELECT id, customerId FROM meters WHERE id = ? OR serialNumber = ?").get(cleanMeterNo, cleanMeterNo) as any;
    const resolvedCustomerId = customerId || (meterRecord ? meterRecord.customerId : null);

    // --- IDEMPOTENCE & PROTECTION ANTI-DOUBLE CLIC ---
    const activeTx = await db.prepare(`
      SELECT id, status, requestDate FROM vending2_transactions
      WHERE meterNo = ? AND operationType = 'RECHARGE' AND amount = ?
      AND status IN ('PENDING', 'PROCESSING')
    `).get(cleanMeterNo, money) as any;

    if (activeTx) {
      throw new Error(`Une transaction de recharge de ${money} FCFA est déjà en cours de traitement pour le compteur ${cleanMeterNo} (ID: ${activeTx.id}).`);
    }

    // Identifiant unique de transaction RenTEC
    const txId = `TX-V2-RECH-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Insérer la transaction à l'état PENDING
    const sqlInsert = isEnterpriseMode
      ? "INSERT INTO vending2_transactions (id, meterNo, customerId, amount, currency, operationType, provider, status, requestDate, createdBy) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"
      : "INSERT INTO vending2_transactions (id, meterNo, customerId, amount, currency, operationType, provider, status, requestDate, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    await db.prepare(sqlInsert).run(txId, cleanMeterNo, resolvedCustomerId, money, 'FCFA', 'RECHARGE', 'VENDING2', 'PENDING', nowIso, operatorUser);

    // Basculer à PROCESSING
    await db.prepare("UPDATE vending2_transactions SET status = 'PROCESSING' WHERE id = ?").run(txId);

    try {
      console.log(`[QPLAT HES] Initiation recharge pour ${cleanMeterNo}: ${money} FCFA (Tx: ${txId})`);

      const json = await futuriseApiClient.rechargeToken(cleanMeterNo, money);
      const responseDate = new Date().toISOString();

      const providerRequestId = json.requestId || null;
      const providerCode = typeof json.code === 'number' ? json.code : 200;
      const providerMsg = json.msg || '';
      const providerStatus = json.status || (providerCode === 200 ? 'success' : 'error');

      // CRITICAL CHECK: Both HTTP status and API payload code (must NOT be 500)
      const isSuccess = providerCode === 200 && providerStatus !== 'error' && json.data !== null;

      if (isSuccess) {
        await db.prepare(`
          UPDATE vending2_transactions
          SET status = 'SUCCESS', providerRequestId = ?, providerCode = ?, providerMsg = ?, providerStatus = ?, responseDate = ?, auditLog = ?
          WHERE id = ?
        `).run(providerRequestId, providerCode, providerMsg, providerStatus, responseDate, JSON.stringify(json), txId);

        // Mettre à jour le crédit du compteur dans RenTEC (Conversion FCFA -> kWh selon barème tranches NIGELEC)
        const isTri = cleanMeterNo.endsWith('86') || cleanMeterNo.includes('400');
        const kwhToAdd = NigelecTariffService.calculateKwh(money, isTri ? 'triphase' : 'monophase');
        await db.prepare("UPDATE meters SET credit = credit + ? WHERE id = ? OR serialNumber = ?").run(kwhToAdd, cleanMeterNo, cleanMeterNo);

        await auditService.log('VENDING2_RECHARGE_SUCCESS', `Recharge Futurise réussie: ${money} FCFA (+${kwhToAdd} kWh) pour ${cleanMeterNo} (ReqID: ${providerRequestId})`, operatorUser, txId);

        return {
          id: txId,
          status: 'SUCCESS',
          meterNo: cleanMeterNo,
          amount: money,
          providerRequestId,
          providerCode,
          providerMsg,
          requestDate: nowIso,
          responseDate,
          data: json.data
        };
      } else {
        const failureReason = providerMsg || `Erreur API Futurise (Code: ${providerCode})`;
        await db.prepare(`
          UPDATE vending2_transactions
          SET status = 'FAILED', providerRequestId = ?, providerCode = ?, providerMsg = ?, providerStatus = ?, failureReason = ?, responseDate = ?, auditLog = ?
          WHERE id = ?
        `).run(providerRequestId, providerCode, providerMsg, providerStatus, failureReason, responseDate, JSON.stringify(json), txId);

        await auditService.log('VENDING2_RECHARGE_FAILED', `Échec recharge Futurise pour ${cleanMeterNo}: ${failureReason}`, operatorUser, txId);

        return {
          id: txId,
          status: 'FAILED',
          meterNo: cleanMeterNo,
          amount: money,
          providerRequestId,
          providerCode,
          providerMsg,
          failureReason,
          requestDate: nowIso,
          responseDate
        };
      }
    } catch (networkErr: any) {
      const responseDate = new Date().toISOString();
      const failureReason = `Erreur réseau ou délai d'attente (Timeout) API Futurise: ${networkErr.message}`;

      // Statut UNKNOWN (Ne JAMAIS convertir automatiquement un timeout en FAILED)
      await db.prepare(`
        UPDATE vending2_transactions
        SET status = 'UNKNOWN', failureReason = ?, responseDate = ?
        WHERE id = ?
      `).run(failureReason, responseDate, txId);

      await auditService.log('VENDING2_RECHARGE_TIMEOUT', `Timeout/Erreur réseau Futurise pour ${cleanMeterNo} (Tx: ${txId}): statut marqué UNKNOWN`, operatorUser, txId);

      return {
        id: txId,
        status: 'UNKNOWN',
        meterNo: cleanMeterNo,
        amount: money,
        failureReason,
        requestDate: nowIso,
        responseDate
      };
    }
  },

  /**
   * 4. POST /meter-recharge/meter-token/0
   * Génération de jeton de gestion (TokenManage: ClearCredit, ClearTamper, PowerLimit, etc.)
   */
  async generateMeterToken(meterNo: string, method: number = 1, subClass: number = 1, value: number = 0, operatorUser: string = 'SYSTEM', customerId?: string) {
    if (!meterNo || !meterNo.trim()) throw new Error("Numéro de compteur requis");
    
    const cleanMeterNo = meterNo.trim();
    const nowIso = new Date().toISOString();

    const subClassNames: Record<number, string> = {
      0: 'MaximumPowerLimit',
      1: 'ClearCredit',
      2: 'TariffRate',
      3: '1stSectionDecoderKey',
      4: '2ndSectionDecoderKey',
      5: 'ClearTamperCondition',
      6: 'MaxPhasePowerUnbal',
      7: 'WaterMeterFactor',
      8: '3rdSectionDecoderKey',
      9: '4thSectionDecoderKey',
      10: 'Extended Token Set',
      11: 'Reserved for Prop Lse'
    };

    const explainName = subClassNames[subClass] || `SubClass-${subClass}`;

    // --- IDEMPOTENCE ---
    const activeTx = await db.prepare(`
      SELECT id FROM vending2_transactions
      WHERE meterNo = ? AND operationType = 'TOKEN_MANAGE' AND subClass = ?
      AND status IN ('PENDING', 'PROCESSING')
    `).get(cleanMeterNo, subClass) as any;

    if (activeTx) {
      throw new Error(`Une opération de jeton [${explainName}] est déjà en cours pour le compteur ${cleanMeterNo}.`);
    }

    const txId = `TX-V2-TOKM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const sqlInsert = isEnterpriseMode
      ? "INSERT INTO vending2_transactions (id, meterNo, customerId, amount, currency, operationType, subClass, provider, explain, status, requestDate, createdBy) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)"
      : "INSERT INTO vending2_transactions (id, meterNo, customerId, amount, currency, operationType, subClass, provider, explain, status, requestDate, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    await db.prepare(sqlInsert).run(txId, cleanMeterNo, customerId || null, value, 'FCFA', 'TOKEN_MANAGE', subClass, 'VENDING2', explainName, 'PENDING', nowIso, operatorUser);

    await db.prepare("UPDATE vending2_transactions SET status = 'PROCESSING' WHERE id = ?").run(txId);

    try {
      console.log(`[QPLAT HES] Envoi TokenManage (${explainName}) pour ${cleanMeterNo} (Tx: ${txId})`);

      const json = await futuriseApiClient.meterToken(cleanMeterNo, subClass, value);
      const responseDate = new Date().toISOString();

      const providerRequestId = json.requestId || null;
      const providerCode = typeof json.code === 'number' ? json.code : 200;
      const providerMsg = json.msg || '';
      const providerStatus = json.status || (providerCode === 200 ? 'success' : 'error');

      const isSuccess = providerCode === 200 && providerStatus !== 'error' && json.data;

      if (isSuccess) {
        const stsToken = json.data?.form || '';
        const providerFlowNo = json.data?.flowNo || null;
        const explain = json.data?.explain || explainName;

        await db.prepare(`
          UPDATE vending2_transactions
          SET status = 'SUCCESS', providerRequestId = ?, providerFlowNo = ?, providerCode = ?, providerMsg = ?, providerStatus = ?, token = ?, explain = ?, responseDate = ?, auditLog = ?
          WHERE id = ?
        `).run(providerRequestId, providerFlowNo, providerCode, providerMsg, providerStatus, stsToken, explain, responseDate, JSON.stringify(json), txId);

        // Intégrer également dans la table globale tokens de RENTEC AMI
        if (stsToken) {
          const tokId = `TOK-V2-${Date.now()}`;
          await db.prepare(`
            INSERT INTO tokens (id, token, rawToken, amount, kwh, meterId, timestamp, expiry, status, type, tid)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(tokId, stsToken, stsToken.replace(/-/g, ''), value, 0, cleanMeterNo, nowIso, new Date(Date.now() + 365*24*3600*1000).toISOString(), 'unused', explainName, Date.now());
        }

        // Action sur compteur dans QPLAT HES selon la SubClass
        if (subClass === 1) { // ClearCredit
          await db.prepare("UPDATE meters SET credit = 0 WHERE id = ? OR serialNumber = ?").run(cleanMeterNo, cleanMeterNo);
        } else if (subClass === 5) { // ClearTamperCondition
          await db.prepare("UPDATE meters SET tamperStatus = 'clear' WHERE id = ? OR serialNumber = ?").run(cleanMeterNo, cleanMeterNo);
        }

        await auditService.log('VENDING2_TOKEN_GENERATE_SUCCESS', `Jeton Futurise [${explain}] généré pour ${cleanMeterNo}: ${stsToken} (FlowNo: ${providerFlowNo})`, operatorUser, txId);

        return {
          id: txId,
          status: 'SUCCESS',
          meterNo: cleanMeterNo,
          subClass,
          explain,
          token: stsToken,
          providerRequestId,
          providerFlowNo,
          providerCode,
          providerMsg,
          requestDate: nowIso,
          responseDate,
          data: json.data
        };
      } else {
        const failureReason = providerMsg || `Erreur génération jeton Futurise (Code: ${providerCode})`;
        await db.prepare(`
          UPDATE vending2_transactions
          SET status = 'FAILED', providerRequestId = ?, providerCode = ?, providerMsg = ?, providerStatus = ?, failureReason = ?, responseDate = ?, auditLog = ?
          WHERE id = ?
        `).run(providerRequestId, providerCode, providerMsg, providerStatus, failureReason, responseDate, JSON.stringify(json), txId);

        await auditService.log('VENDING2_TOKEN_GENERATE_FAILED', `Échec génération jeton [${explainName}] pour ${cleanMeterNo}: ${failureReason}`, operatorUser, txId);

        return {
          id: txId,
          status: 'FAILED',
          meterNo: cleanMeterNo,
          subClass,
          explain: explainName,
          providerRequestId,
          providerCode,
          providerMsg,
          failureReason,
          requestDate: nowIso,
          responseDate
        };
      }
    } catch (networkErr: any) {
      const responseDate = new Date().toISOString();
      const failureReason = `Erreur réseau ou timeout API Futurise: ${networkErr.message}`;

      await db.prepare(`
        UPDATE vending2_transactions
        SET status = 'UNKNOWN', failureReason = ?, responseDate = ?
        WHERE id = ?
      `).run(failureReason, responseDate, txId);

      await auditService.log('VENDING2_TOKEN_TIMEOUT', `Timeout Futurise TokenManage pour ${cleanMeterNo} (Tx: ${txId}): statut marqué UNKNOWN`, operatorUser, txId);

      return {
        id: txId,
        status: 'UNKNOWN',
        meterNo: cleanMeterNo,
        subClass,
        explain: explainName,
        failureReason,
        requestDate: nowIso,
        responseDate
      };
    }
  },

  // --- FONCTIONS MÉTIER SPÉCIFIQUES POUR QPLAT HES ---

  /**
   * Métier QPLAT HES: Initier une recharge de crédit prépayé
   */
  async initierRecharge(meterNo: string, montant: number, operatorUser: string = 'SYSTEM', customerId?: string) {
    return this.rechargeMeter(meterNo, montant, operatorUser, customerId);
  },

  /**
   * Métier QPLAT HES: Effacer le crédit du compteur (SubClass 1: ClearCredit)
   */
  async effacerCredit(meterNo: string, operatorUser: string = 'SYSTEM', customerId?: string) {
    return this.generateMeterToken(meterNo, 1, 1, 0, operatorUser, customerId);
  },

  /**
   * Métier QPLAT HES: Levée de doute / Effacement alerte tamper (SubClass 5: ClearTamperCondition)
   */
  async leveeTamper(meterNo: string, operatorUser: string = 'SYSTEM', customerId?: string) {
    return this.generateMeterToken(meterNo, 1, 5, 0, operatorUser, customerId);
  },

  /**
   * Métier QPLAT HES: Consulter l'historique des jetons et transactions d'un compteur
   */
  async consulterHistoriqueToken(meterNo: string, limit = 100) {
    return this.getTransactions(limit, meterNo);
  },

  /**
   * Récupère l'historique des transactions Vending2/Futurise
   */
  async getTransactions(limit = 100, meterNo?: string, status?: string) {
    let query = "SELECT * FROM vending2_transactions WHERE 1=1";
    const params: any[] = [];

    if (meterNo) {
      query += " AND meterNo = ?";
      params.push(meterNo.trim());
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY requestDate DESC LIMIT ?";
    params.push(limit);

    return db.prepare(query).all(...params);
  },

  /**
   * Obtenir une transaction par son ID
   */
  async getTransactionById(id: string) {
    return db.prepare("SELECT * FROM vending2_transactions WHERE id = ?").get(id);
  },

  /**
   * Métier QPLAT HES: Lecture Télémesure Temps-Réel DLMS/COSEM — SERVEUR LOCAL SOUVERAIN
   * Lit les valeurs directement depuis la base de données locale (SQLite/PostgreSQL)
   * et met à jour les grandeurs électriques instantanées en temps réel.
   */
  async readMeterValue(meterNo: string, operatorUser: string = 'SYSTEM') {
    if (!meterNo || !meterNo.trim()) throw new Error("Numéro de compteur requis");
    const cleanMeterNo = meterNo.trim();

    console.log(`[HES PROBE] Interrogation télémesure DLMS/COSEM en direct pour ${cleanMeterNo}...`);

    // 0. Charger le compteur depuis la base de données
    const meter = await db.prepare(
      "SELECT * FROM meters WHERE id = ? OR serialNumber = ?"
    ).get(cleanMeterNo, cleanMeterNo) as any;

    if (!meter) {
      throw new Error(`Compteur ${cleanMeterNo} introuvable dans la base locale`);
    }

    // 1. Interroger le serveur HES central en direct (Futurise DLMS)
    let realHesTelemetry: any = null;
    let isPhysicalOnline = false;
    try {
      const hesRes = await futuriseApiClient.readMeterValue(cleanMeterNo);
      if (hesRes && hesRes.code === 200 && hesRes.parsedTelemetry) {
        realHesTelemetry = hesRes.parsedTelemetry;
        isPhysicalOnline = true;
      } else {
        console.warn(`[HES PROBE] Compteur ${cleanMeterNo} injoignable via HES (Code: ${hesRes?.code}, Msg: ${hesRes?.msg?.trim() || 'No response'})`);
      }
    } catch (hesErr: any) {
      console.warn(`[HES PROBE] Erreur interrogation HES pour ${cleanMeterNo}: ${hesErr.message}`);
    }

    const nowIso = new Date().toISOString();

    // 2. Si le compteur physique ne répond pas (HORS-LIGNE sur le réseau GPRS) :
    //    On marque STRICTEMENT 'offline' et on NE MET PAS À JOUR lastTelemetrySync pour éviter de tromper le Watchdog.
    if (!isPhysicalOnline) {
      await db.prepare("UPDATE meters SET status = 'offline', lastUpdate = ? WHERE id = ? OR serialNumber = ?").run(
        nowIso, cleanMeterNo, cleanMeterNo
      );

      return {
        code: 500,
        success: false,
        source: "FUTURISE_HES_GPRS",
        meterNo: cleanMeterNo,
        status: "offline",
        msg: `Compteur ${cleanMeterNo} hors-ligne : échec de communication DLMS avec le modem GPRS physique.`,
        timestamp: nowIso
      };
    }

    // 3. Compteur joignable physiquement : mise à jour avec les véritables données télémétriques
    const isTriphase = meter.phaseType === 'triphase';
    const nominalVoltage = isTriphase ? 400.0 : 230.0;
    const voltage = realHesTelemetry.voltageA || meter.voltage || nominalVoltage;
    const currentA = realHesTelemetry.currentA || 0;
    const powerW = (realHesTelemetry.powerA || 0) * 1000;
    const powerFactor = meter.powerFactor || 0.98;
    const frequency = meter.frequency || 50.0;
    const remainingCredit = realHesTelemetry.remainingCreditKwh !== undefined ? realHesTelemetry.remainingCreditKwh : meter.credit;

    const calculatedPowerKw = (realHesTelemetry.powerA !== undefined && realHesTelemetry.powerA > 0)
      ? realHesTelemetry.powerA
      : +((voltage * currentA * powerFactor) / 1000).toFixed(3);

    const updatedRelayStatus = meter.relayStatus === 'OPEN' ? 'OPEN' : (realHesTelemetry.relayStatus || meter.relayStatus || 'CLOSED');
    const updatedStatus = updatedRelayStatus === 'OPEN' ? 'offline' : 'online';

    const totalConsumptionKwh = (typeof realHesTelemetry.totalElectricityKwh === 'number')
      ? realHesTelemetry.totalElectricityKwh
      : (typeof meter.totalConsumption === 'number')
        ? meter.totalConsumption
        : 0;

    const updatedTamperStatus = (realHesTelemetry.meterCoverOpen || realHesTelemetry.terminalCoverOpen || realHesTelemetry.tamperStatus === 'detected')
      ? 'tampered'
      : (meter.tamperStatus || 'clear');

    await db.prepare(`
      UPDATE meters SET 
        status = ?,
        relayStatus = ?,
        voltage = ?,
        current = ?,
        power = ?,
        credit = ?,
        totalConsumption = ?,
        frequency = ?,
        powerFactor = ?,
        tamperStatus = ?,
        lastTelemetrySync = ?,
        lastUpdate = ?
      WHERE id = ? OR serialNumber = ?
    `).run(
      updatedStatus,
      updatedRelayStatus,
      voltage,
      parseFloat(currentA.toFixed(3)),
      calculatedPowerKw,
      remainingCredit,
      totalConsumptionKwh,
      frequency,
      powerFactor,
      updatedTamperStatus,
      nowIso,
      nowIso,
      cleanMeterNo,
      cleanMeterNo
    );

    // Si sabotage détecté, consigner l'alerte de fraude
    if (realHesTelemetry.meterCoverOpen || realHesTelemetry.terminalCoverOpen || realHesTelemetry.tamperStatus === 'detected') {
      try {
        const existingAlert = await db.prepare(
          "SELECT id FROM alerts WHERE meterId = ? AND category = 'fraud' AND status = 'ACTIVE'"
        ).get(cleanMeterNo);
        if (!existingAlert) {
          await db.prepare(`
            INSERT INTO alerts (id, meterId, type, category, priority, message, timestamp, status)
            VALUES (?, ?, 'ANTI_FRAUD_ALARM', 'fraud', 'Urgent', ?, ?, 'ACTIVE')
          `).run(
            `ALT-TAMPER-${Date.now()}`,
            cleanMeterNo,
            `Alerte Fraude Physique: Ouverture de capot détectée (OBIS 0.0.96.11.0.255) sur le compteur ${cleanMeterNo}`,
            nowIso
          );
        }
      } catch (e: any) {
        console.warn("[HES] Erreur création alerte tamper:", e.message);
      }
    }

    // 4. Enregistrement automatique dans interval_data pour archivage historique continu
    let lastInterval = await db.prepare(
      "SELECT * FROM interval_data WHERE meterId = ? ORDER BY timestamp DESC LIMIT 1"
    ).get(cleanMeterNo) as any;

    try {
      const prevReading = lastInterval ? (lastInterval.reading || 0) : 0;
      const consumptionDelta = (totalConsumptionKwh > prevReading && prevReading > 0)
        ? +(totalConsumptionKwh - prevReading).toFixed(3)
        : 0;

      const newIntervalId = `INT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await db.prepare(`
        INSERT INTO interval_data (
          id, meterId, timestamp, reading, consumption, voltage, current, powerFactor, status,
          voltageL1, voltageL2, voltageL3, currentL1, currentL2, currentL3
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newIntervalId,
        cleanMeterNo,
        nowIso,
        totalConsumptionKwh,
        consumptionDelta,
        voltage,
        parseFloat(currentA.toFixed(3)),
        powerFactor,
        'VALID',
        voltage,
        realHesTelemetry?.voltageB || (isTriphase ? voltage : 0),
        realHesTelemetry?.voltageC || (isTriphase ? voltage : 0),
        currentA,
        realHesTelemetry?.currentB || (isTriphase ? currentA : 0),
        realHesTelemetry?.currentC || (isTriphase ? currentA : 0)
      );

      lastInterval = {
        id: newIntervalId,
        meterId: cleanMeterNo,
        timestamp: nowIso,
        reading: totalConsumptionKwh,
        consumption: consumptionDelta
      };
    } catch (intErr: any) {
      console.warn(`[HES] Erreur insertion interval_data:`, intErr.message);
    }

    // 5. Construire la réponse télémétrique normalisée (format OBIS DLMS/COSEM)
    const telemetry = {
      code: 200,
      msg: "Lecture télémétrique temps-réel DLMS réussie",
      source: "FUTURISE_HES_GPRS",
      timestamp: nowIso,
      meterNo: cleanMeterNo,
      parsedTelemetry: {
        meterNo: cleanMeterNo,
        phaseType: meter.phaseType,
        // Grandeurs instantanées Phase A (ou monophasé)
        voltageA: voltage,
        currentA: parseFloat(currentA.toFixed(3)),
        powerA: parseFloat((powerW / (isTriphase ? 3 : 1)).toFixed(1)),
        // Grandeurs instantanées Phase B (triphasé uniquement)
        voltageB: isTriphase ? voltage : 0,
        currentB: isTriphase ? parseFloat((currentA).toFixed(3)) : 0,
        powerB: isTriphase ? parseFloat((powerW / 3).toFixed(1)) : 0,
        // Grandeurs instantanées Phase C (triphasé uniquement)
        voltageC: isTriphase ? voltage : 0,
        currentC: isTriphase ? parseFloat((currentA).toFixed(3)) : 0,
        powerC: isTriphase ? parseFloat((powerW / 3).toFixed(1)) : 0,
        // Grandeurs communes
        totalPowerKw: calculatedPowerKw,
        frequency: frequency,
        powerFactor: powerFactor,
        totalElectricityKwh: totalConsumptionKwh,
        remainingCreditKwh: remainingCredit,
        // Sécurité & état physique
        meterCoverOpen: realHesTelemetry.meterCoverOpen || false,
        terminalCoverOpen: realHesTelemetry.terminalCoverOpen || false,
        relayStatus: updatedRelayStatus,
        tamperStatus: (realHesTelemetry.meterCoverOpen || realHesTelemetry.terminalCoverOpen) ? 'detected' : 'clear',
        // Métadonnées
        firmware: meter.firmware || 'v2.4.1',
        protocol: meter.protocol || 'DLMS/COSEM',
        subscribedPower: meter.subscribedPower || 9.0,
        // Dernière lecture intervalle
        lastIntervalReading: lastInterval ? {
          timestamp: lastInterval.timestamp,
          voltage: lastInterval.voltage,
          current: lastInterval.current,
          consumption: lastInterval.consumption,
          powerFactor: lastInterval.powerFactor,
        } : null,
      }
    };

    await auditService.log('HES_LOCAL_METER_READ', `Lecture télémesure locale DLMS/COSEM pour ${cleanMeterNo}`, operatorUser);
    return telemetry;
  },

  /**
   * Métier QPLAT HES: Télé-coupure du disjoncteur pour maintenance (DLMS meter-lz / OBIS 0.0.96.3.10.255)
   * Conformité Spécification Constructeur Futurise Technologies (Sections 3.8 & 3.9)
   * Coupe la distribution électrique à distance SANS détruire le crédit de l'abonné.
   */
  async remoteControlRelayOpen(meterNo: string, roomName: string = "10", operatorUser: string = 'SYSTEM') {
    if (!meterNo || !meterNo.trim()) throw new Error("Numéro de compteur requis");
    const cleanMeterNo = meterNo.trim();

    console.log(`[QPLAT HES] Télé-coupure disjoncteur maintenance pour ${cleanMeterNo} (Futurise POST /meter-control/meter-lz)`);
    
    // 1. Ordre direct de télé-coupure via l'API constructeur (Section 3.8 meter-lz)
    const result = await futuriseApiClient.remoteControlRelayOpen(cleanMeterNo, roomName);

    // 2. Mettre à jour l'état du relais dans le HES (relais OUVERT, le crédit reste intact)
    await db.prepare("UPDATE meters SET status = 'offline', relayStatus = 'OPEN', lastUpdate = ? WHERE id = ? OR serialNumber = ?").run(
      new Date().toISOString(), cleanMeterNo, cleanMeterNo
    );

    const auditDetail = `Télé-coupure maintenance (Relay Open / meter-lz) exécutée pour ${cleanMeterNo} (RoomName: ${roomName}, ReqID: ${result?.requestId || 'N/A'})`;
    await auditService.log('VENDING2_RELAY_OPEN', auditDetail, operatorUser);

    return {
      success: true,
      meterNo: cleanMeterNo,
      action: 'open',
      relayStatus: 'OPEN',
      requestId: result?.requestId,
      msg: `⚡ Commande de Télé-Coupure Maintenance (meter-lz / Relais OUVERT) transmise avec succès au compteur ${cleanMeterNo}. Le crédit abonné reste 100% préservé.`,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Métier QPLAT HES: Réarmement du disjoncteur après maintenance (DLMS meter-hz / OBIS 0.0.96.3.10.255)
   * Conformité Spécification Constructeur Futurise Technologies (Section 3.9)
   */
  async remoteControlRelayClose(meterNo: string, roomName: string = "10", operatorUser: string = 'SYSTEM') {
    if (!meterNo || !meterNo.trim()) throw new Error("Numéro de compteur requis");
    const cleanMeterNo = meterNo.trim();

    console.log(`[QPLAT HES] Réarmement disjoncteur fin maintenance pour ${cleanMeterNo} (Futurise POST /meter-control/meter-hz)`);

    // 1. Ordre direct de réarmement via l'API constructeur (Section 3.9 meter-hz)
    const result = await futuriseApiClient.remoteControlRelayClose(cleanMeterNo, roomName);

    // 2. Mettre à jour l'état du relais dans le HES (relais FERMÉ / Rétabli)
    await db.prepare("UPDATE meters SET status = 'online', relayStatus = 'CLOSED', lastUpdate = ? WHERE id = ? OR serialNumber = ?").run(
      new Date().toISOString(), cleanMeterNo, cleanMeterNo
    );

    const auditDetail = `Réarmement fin maintenance (Relay Close / meter-hz) exécuté pour ${cleanMeterNo} (RoomName: ${roomName}, ReqID: ${result?.requestId || 'N/A'})`;
    await auditService.log('VENDING2_RELAY_CLOSE', auditDetail, operatorUser);

    return {
      success: true,
      meterNo: cleanMeterNo,
      action: 'close',
      relayStatus: 'CLOSED',
      requestId: result?.requestId,
      msg: `🔌 Commande de Réarmement (meter-hz / Relais FERMÉ) transmise avec succès au compteur ${cleanMeterNo}. Rétablissement immédiat du courant.`,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Métier QPLAT HES: Recherche d'historique de recharge par flowNo (GET /meter-recharge/0)
   */
  async getChargeRecordByFlowNo(flowNo: string) {
    if (!flowNo || !flowNo.trim()) throw new Error("flowNo requis");
    return futuriseApiClient.getChargeRecord(flowNo);
  },

  /**
   * Métier QPLAT HES: Recharge Directe (Direct Top-up sans jeton 20 chiffres) (POST /meter-recharge/recharge/0)
   */
  async directRechargeMeter(meterNo: string, montant: number, operatorUser: string = 'SYSTEM') {
    return this.rechargeMeter(meterNo, montant, operatorUser);
  },

  /**
   * Métier QPLAT HES: Synchronisation Horloge RTC DLMS/COSEM (OBIS 0.0.1.0.0.255)
   */
  async syncClock(meterNo: string, targetTime?: string, operatorUser: string = 'SYSTEM') {
    if (!meterNo || !meterNo.trim()) throw new Error("Numéro de compteur requis");
    const cleanMeterNo = meterNo.trim();

    console.log(`[QPLAT HES] Synchronisation horloge RTC pour ${cleanMeterNo}`);
    const result = await futuriseApiClient.syncClock(cleanMeterNo, targetTime);

    await auditService.log('VENDING2_CLOCK_SYNC', `Synchronisation horloge RTC DLMS/COSEM exécutée pour ${cleanMeterNo}`, operatorUser);
    return result;
  },

  /**
   * Synchronisation automatique des recharges et crédits depuis le serveur central Futurise HES
   */
  async syncFuturiseRecharges(meterNos?: string[]) {
    try {
      const targetMeters = meterNos && meterNos.length > 0
        ? meterNos
        : (await db.prepare("SELECT id FROM meters").all() as any[]).map(m => m.id);

      const existingTokens = await db.prepare('SELECT rawToken, token FROM tokens').all() as any[];
      const existingSet = new Set<string>();
      for (const t of existingTokens) {
        if (t.rawToken) existingSet.add(t.rawToken.replace(/[\s-]/g, ''));
        if (t.token) existingSet.add(t.token.replace(/[\s-]/g, ''));
      }

      let totalSynced = 0;
      for (const meterId of targetMeters) {
        try {
          const res = await fetch(`https://dlms.futurise-tech.com:4680/api/v1/recharge?meterNo=${meterId}&pageSize=100`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await futuriseApiClient.getValidToken()}`
            }
          });
          const json = await res.json() as any;
          const list = json?.data?.list || [];

          for (const item of list) {
            const rawForm = (item.form || '').replace(/[\s-]/g, '');
            if (!rawForm || rawForm.length < 16) continue;
            if (existingSet.has(rawForm)) continue;

            const kwh = Number(item.money || 0);
            if (kwh <= 0 || kwh > 500) continue;

            const formatted = rawForm.match(/.{1,4}/g)?.join('-') || rawForm;
            const amount = Math.round(kwh * 98.7);
            const isoDate = item.buyTime ? new Date(item.buyTime).toISOString() : new Date().toISOString();
            const tokenId = `TOK-FUTURISE-${item.id || Date.now()}`;

            await db.prepare(`
              INSERT INTO tokens (id, token, rawToken, amount, kwh, meterId, customerId, timestamp, status, type)
              VALUES (?, ?, ?, ?, ?, ?, 'CUST-Z8RD', ?, 'used', 'recharge')
            `).run(tokenId, formatted, rawForm, amount, kwh, meterId, isoDate);

            existingSet.add(rawForm);
            totalSynced++;
          }
        } catch (mErr: any) {
          console.warn(`[HES SYNC] Échec sync pour ${meterId}:`, mErr.message);
        }
      }
      return { success: true, totalSynced };
    } catch (err: any) {
      console.error("[HES SYNC ERROR]:", err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Diagnostic Santé & Statut du Connecteur Futurise / Vending2
   */
  async checkHealth() {
    return {
      enabled: process.env.VENDING2_ENABLED !== 'false',
      baseUrl: process.env.FUTURISE_BASE_URL || process.env.VENDING2_BASE_URL || 'https://47.90.150.122:4680/api/v1',
      timeoutMs: Number(process.env.FUTURISE_TIMEOUT) || 15000
    };
  }
};
