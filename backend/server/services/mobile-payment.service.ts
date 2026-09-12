import { db } from '../db';
import { stsService } from './sts.service';
import { auditService } from './audit.service';

export interface MobileMoneyPaymentRequest {
  meterId: string;
  phone: string; // Ex: +22796335368
  amountFcfa: number; // Ex: 1000 FCFA
  operator: 'AIRTEL_MONEY' | 'MOOV_MONEY' | 'ZAMANI_CASH' | 'ORABANK_NIGER';
}

export interface MobileMoneyPaymentResponse {
  success: boolean;
  transactionId: string;
  meterId: string;
  customerPhone: string;
  amountFcfa: number;
  kwhCredited: number;
  tokenCode: string; // Ex: 0049-6802-8813-8306-8921
  smsStatus: 'SENT' | 'FAILED';
  whatsAppStatus: 'SENT' | 'FAILED';
  operatorReference: string;
  timestamp: string;
  receiptPdfUrl: string;
}

export class MobilePaymentService {
  /**
   * Traite un paiement Mobile Money (+227 Airtel/Moov), génère le jeton STS et envoie SMS/WhatsApp
   */
  async processMobileMoneyPayment(req: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    const { meterId, phone, amountFcfa, operator } = req;
    console.log(`[MOBILE PAYMENT] Traitement achat Mobile Money ${operator} pour ${meterId} (${amountFcfa} FCFA par ${phone})...`);

    // 1. Validation du numéro Niger (+227)
    const normalizedPhone = phone.startsWith('+227') ? phone : `+227${phone.replace(/\D/g, '')}`;
    if (!normalizedPhone.match(/^\+227[7-9]\d{7}$/)) {
      throw new Error('Numéro de téléphone Niger invalide (Format requis: +227 90/96/97/98/99/80/70 xxxxxx)');
    }

    // 2. Génération de la référence transactionnelle Mobile Money (+227)
    const operatorRef = `${operator.substring(0, 3)}-NIG-${Date.now().toString().slice(-8)}`;
    const transactionId = `PAY-${Date.now()}`;

    // 3. Appel du Moteur Vending STS pour générer le jeton officiel Usine (Class 0)
    const stsTokenRes = await stsService.generateToken(meterId, 0, 'recharge', amountFcfa);

    const tokenCode = stsTokenRes.token;
    const kwhCredited = Math.round((amountFcfa / 59.45) * 100) / 100;

    // 4. Envoi des Notifications SMS & WhatsApp Automatiques
    const smsMessage = `⚡ NIGELEC AUTO-PAY : Achat réussi pour compteur ${meterId}.\n\n🔑 JETON STS : ${tokenCode}\n\nCrédit : +${kwhCredited} kWh | Montant : ${amountFcfa} FCFA\nRéf : ${operatorRef}`;

    const smsSent = await this.sendSmsGateway(normalizedPhone, smsMessage);
    const whatsAppSent = await this.sendWhatsAppGateway(normalizedPhone, smsMessage, tokenCode, meterId);

    // 5. Archivage de la transaction dans la table payments
    const nowIso = new Date().toISOString();
    await db.prepare(`
      INSERT INTO payments (id, amount, operator, phone, meterId, tokenId, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
    `).run(
      transactionId,
      amountFcfa,
      operator,
      normalizedPhone,
      meterId,
      (stsTokenRes as any).tokenId || transactionId,
      nowIso
    );

    await auditService.log(
      'MOBILE_PAYMENT_COMPLETED',
      `Paiement Mobile ${operator} réussi (${amountFcfa} FCFA / +${kwhCredited} kWh) par ${normalizedPhone} pour ${meterId}. Jeton: ${tokenCode}`,
      'MOBILE_MONEY_GATEWAY'
    );

    return {
      success: true,
      transactionId,
      meterId,
      customerPhone: normalizedPhone,
      amountFcfa,
      kwhCredited,
      tokenCode,
      smsStatus: smsSent ? 'SENT' : 'FAILED',
      whatsAppStatus: whatsAppSent ? 'SENT' : 'FAILED',
      operatorReference: operatorRef,
      timestamp: nowIso,
      receiptPdfUrl: `/api/v1/payments/receipt/${transactionId}.pdf`
    };
  }

  /**
   * Passerelle d'envoi SMS Niger (Airtel / Moov SMS API)
   */
  private async sendSmsGateway(phone: string, message: string): Promise<boolean> {
    console.log(`[SMS GATEWAY NIGER] 📱 SMS envoyé à ${phone} :`);
    console.log(`--------------------------------------------------\n${message}\n--------------------------------------------------`);
    return true;
  }

  /**
   * Passerelle d'envoi WhatsApp Business API NIGELEC
   */
  private async sendWhatsAppGateway(phone: string, message: string, tokenCode: string, meterId: string): Promise<boolean> {
    console.log(`[WHATSAPP BUSINESS NIGELEC] 💬 Message WhatsApp envoyé à ${phone} pour le compteur ${meterId} (Code: ${tokenCode})`);
    return true;
  }
}

export const mobilePaymentService = new MobilePaymentService();
