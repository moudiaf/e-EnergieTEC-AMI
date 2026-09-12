import { Meter, Tariff, Token, Invoice } from '../types';
import { format } from 'date-fns';

/**
 * Calcule les détails d'une recharge prépayée selon les tarifs NIGELEC
 */
export const calculateRechargeDetails = (amount: number, meter: Meter, allTariffs: Record<string, Tariff>) => {
  if (!amount || amount <= 0 || !meter) {
    return { kwh: 0, primeFixe: 0, redevance: 0, taxe: 0, rate: 0, netAmount: 0, tva: 0, taxeORNT: 0, taxeMunicipale: 0 };
  }

  const isTri = meter.phaseType === 'triphase' || meter.id?.endsWith('86');
  // Tarification NIGELEC (BT-D 59.45 FCFA/kWh vs BT-P 98.50 FCFA/kWh)
  const rate = isTri ? 98.50 : 59.45;
  const kwh = Number((amount / rate).toFixed(2));

  return {
    kwh,
    primeFixe: 0,
    redevance: 0,
    taxe: 0,
    rate,
    netAmount: amount,
    tva: Math.round(amount * 0.19),
    taxeORNT: 0,
    taxeMunicipale: 0
  };
};

/**
 * Simulation d'un cycle de facturation (calcul des montants mensuels)
 */
export const calculateMonthlyInvoice = (kwhConsumed: number, meter: Meter, allTariffs: Record<string, Tariff>): Partial<Invoice> => {
  const tariff = allTariffs[meter.type] || Object.values(allTariffs)[0];
  const tiers = Array.isArray(tariff.tiers) ? tariff.tiers : [];

  let totalHT = 0;
  let totalTVA = 0;
  let remainingKwh = kwhConsumed;
  let lastRate = tariff.rate;

  if (tiers.length > 0) {
    for (const tier of tiers) {
      const tierMax = tier.maxKwh || Infinity;
      const tierMin = tier.minKwh || 0;
      const tierCapacity = tierMax === Infinity ? Infinity : tierMax - tierMin;
      const currentVatRate = (tier.vatRate !== undefined ? tier.vatRate : (tariff.taxRate || 19)) / 100;

      // TOU Logic (Section 4.3): Peak/Off-Peak rate adjustment
      let effectiveRate = tier.rate;
      if (tariff.isTou) {
        const hour = new Date().getHours();
        const isOffPeak = hour >= 23 || hour < 6; // Heures Creuses: 23h - 06h
        if (isOffPeak) {
          effectiveRate *= 0.7; // 30% reduction during off-peak
        }
      }

      if (remainingKwh <= tierCapacity || tierMax === Infinity) {
        const costHT = remainingKwh * effectiveRate;
        totalHT += costHT;
        totalTVA += costHT * currentVatRate;
        lastRate = effectiveRate;
        remainingKwh = 0;
        break;
      } else {
        const costHT = tierCapacity * effectiveRate;
        totalHT += costHT;
        totalTVA += costHT * currentVatRate;
        remainingKwh -= tierCapacity;
        lastRate = effectiveRate;
      }
    }
  } else {
    let effectiveRate = tariff.rate;
    if (tariff.isTou) {
      const hour = new Date().getHours();
      const isOffPeak = hour >= 23 || hour < 6;
      if (isOffPeak) effectiveRate *= 0.7;
    }
    totalHT = kwhConsumed * effectiveRate;
    totalTVA = totalHT * ((tariff.taxRate || 19) / 100);
    lastRate = effectiveRate;
  }

  const fixedMonthlyFee = Number(tariff.fixedMonthlyFee || 0);
  const baseRedevance = tiers[0] ? Number(tiers[0].redevance) : 0;
  const basePrime = tiers[0] ? Number(tiers[0].primeFixe || 0) : 0;
  const taxeHabitat = tiers[0] ? Number(tiers[0].taxeHabitat || 0) : 0;

  const additionalFees = fixedMonthlyFee + baseRedevance + basePrime;
  const globalVatRate = (tariff.taxRate || 19) / 100;
  const vatOnFees = additionalFees * globalVatRate;

  return {
    amountHT: +(totalHT + additionalFees).toFixed(2),
    tva: +(totalTVA + vatOnFees).toFixed(2),
    totalTTC: +(totalHT + additionalFees + totalTVA + vatOnFees + taxeHabitat).toFixed(2),
    kwhConsumed: +kwhConsumed.toFixed(3),
    rate: +lastRate.toFixed(2),
    taxe: taxeHabitat
  };
};
