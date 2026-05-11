import { Meter, Tariff, Token, Invoice } from '../types';
import { format } from 'date-fns';

/**
 * Calcule les détails d'une recharge prépayée selon les tarifs NIGELEC
 */
export const calculateRechargeDetails = (amount: number, meter: Meter, allTariffs: Record<string, Tariff>) => {
  if (!amount || !meter) return { kwh: 0, primeFixe: 0, redevance: 0, taxe: 0, rate: 0, netAmount: 0, tva: 0, taxeORNT: 0, taxeMunicipale: 0 };

  const tariff = allTariffs[meter.type] || Object.values(allTariffs)[0];
  const tiers = Array.isArray(tariff.tiers) ? tariff.tiers : [];

  // Charges fixes mensuelles (prélevées en priorité)
  const fixedMonthlyFee = Number(tariff.fixedMonthlyFee || 0);
  const baseRedevance   = tiers[0] ? Number(tiers[0].redevance)   : 0;  // Éclairage public
  const baseTaxHabitat  = tiers[0] ? Number(tiers[0].taxeHabitat) : 0;  // Taxe Habitat
  const basePrime       = tiers[0] ? Number(tiers[0].primeFixe || 0) : 0;

  // Taux de redevances proportionnelles (FCFA/kWh)
  const ortnRate     = tiers[0] ? Number(tiers[0].taxeORNT      || 0) : 0;  // 3 FCFA/kWh
  const municipRate  = tiers[0] ? Number(tiers[0].taxeMunicipale || 0) : 0;  // 2 FCFA/kWh

  const totalFixedFees = fixedMonthlyFee + baseRedevance + baseTaxHabitat + basePrime;
  let remainingAmount = amount - totalFixedFees;

  if (remainingAmount <= 0) {
    return { kwh: 0, primeFixe: basePrime, redevance: baseRedevance + fixedMonthlyFee, taxe: baseTaxHabitat, rate: tariff.rate, netAmount: 0, tva: 0, taxeORNT: 0, taxeMunicipale: 0 };
  }

  let totalKwh = 0;
  let lastRate = tariff.rate;
  let remainingToBuy = remainingAmount;
  let totalTva = 0;
  let totalORNT = 0;
  let totalMunicipal = 0;

  if (tiers.length > 0) {
    for (const tier of tiers) {
      const tierMax = tier.maxKwh || Infinity;
      const tierMin = tier.minKwh || 0;
      const tierCapacity = tierMax === Infinity ? Infinity : tierMax - tierMin;

      // Taux effectif (TOU si applicable)
      let effectiveRate = tier.rate;
      if (tariff.isTou) {
        const hour = new Date().getHours();
        const isOffPeak = hour >= 23 || hour < 6;
        if (isOffPeak) effectiveRate *= 0.7;
      }

      const tierORNT    = Number(tier.taxeORNT      || 0);
      const tierMunic   = Number(tier.taxeMunicipale || 0);
      const currentVatRate = (tier.vatRate !== undefined ? tier.vatRate : (tariff.taxRate || 19)) / 100;

      // Coût total par kWh = énergie HT * (1+TVA) + ORTN + Municipal
      const costPerKwh = effectiveRate * (1 + currentVatRate) + tierORNT + tierMunic;
      const tierCostTotal = tierCapacity === Infinity ? Infinity : tierCapacity * costPerKwh;

      if (remainingToBuy <= tierCostTotal || tierMax === Infinity) {
        const energyPurchased = remainingToBuy / costPerKwh;
        totalKwh       += energyPurchased;
        totalTva       += energyPurchased * effectiveRate * currentVatRate;
        totalORNT      += energyPurchased * tierORNT;
        totalMunicipal += energyPurchased * tierMunic;
        lastRate        = effectiveRate;
        remainingToBuy  = 0;
        break;
      } else {
        totalKwh       += tierCapacity;
        totalTva       += tierCapacity * effectiveRate * currentVatRate;
        totalORNT      += tierCapacity * tierORNT;
        totalMunicipal += tierCapacity * tierMunic;
        remainingToBuy -= tierCostTotal;
        lastRate        = effectiveRate;
      }
    }
  }

  return {
    kwh: totalKwh > 0 ? totalKwh : 0,
    primeFixe: basePrime,
    redevance: baseRedevance + fixedMonthlyFee,
    taxe: baseTaxHabitat,
    rate: lastRate,
    tva: totalTva,
    netAmount: remainingAmount > 0 ? remainingAmount : 0,
    taxeORNT: totalORNT,
    taxeMunicipale: totalMunicipal
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
    amountHT: totalHT + additionalFees,
    tva: totalTVA + vatOnFees,
    totalTTC: totalHT + additionalFees + totalTVA + vatOnFees + taxeHabitat,
    kwhConsumed,
    rate: lastRate,
    taxe: taxeHabitat
  };
};
