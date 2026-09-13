import { Request, Response } from 'express';
import { db } from '../db';

export const StatisticsController = {
  /**
   * 1. GET /api/statistics/consumption-matrix
   * Récupère la matrice de consommation 100% issue de la base de données réelle :
   * - Quotidien (jours 1 à 31) pour un mois donné (mode=daily)
   * - Mensuel (12 mois de Janvier à Décembre) pour une année donnée (mode=monthly)
   */
  async getConsumptionMatrix(req: Request, res: Response) {
    try {
      const mode = (req.query.mode as string) || 'daily';
      const yearMonth = (req.query.yearMonth as string) || '2026-08';
      const yearParam = req.query.year ? parseInt(req.query.year as string, 10) : parseInt(yearMonth.substring(0, 4), 10);
      const zoneQuery = ((req.query.zone as string) || '').trim().toUpperCase();
      const meterQuery = ((req.query.meterId as string) || '').trim().toLowerCase();
      const userQuery = ((req.query.username as string) || '').trim().toLowerCase();

      // Récupérer les compteurs réels de la base SQLite
      let sqlMeters = `
        SELECT 
          m.id as meterId,
          m.location,
          m.type as meterType,
          m.phaseType,
          m.credit,
          m.totalConsumption,
          m.status as meterStatus,
          c.id as customerId,
          c.name as customerName,
          COALESCE(c.regionId, 'NIAMEY') as regionId,
          COALESCE(d.name, 'Concentrateur Central') as dcuName
        FROM meters m
        LEFT JOIN customers c ON m.customerId = c.id
        LEFT JOIN dcus d ON m.dcuId = d.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (meterQuery) {
        sqlMeters += ` AND LOWER(m.id) LIKE ?`;
        params.push(`%${meterQuery}%`);
      }
      if (userQuery) {
        sqlMeters += ` AND (LOWER(c.name) LIKE ? OR LOWER(c.id) LIKE ?)`;
        params.push(`%${userQuery}%`, `%${userQuery}%`);
      }
      if (zoneQuery && zoneQuery !== 'NIGER' && zoneQuery !== 'ALL') {
        sqlMeters += ` AND (UPPER(c.regionId) LIKE ? OR UPPER(m.location) LIKE ? OR UPPER(d.name) LIKE ?)`;
        params.push(`%${zoneQuery}%`, `%${zoneQuery}%`, `%${zoneQuery}%`);
      }

      const meters = await db.prepare(sqlMeters).all(...params) as any[];

      if (mode === 'monthly') {
        // --- RAPPORT MENSUEL (12 MOIS) ---
        const startDate = `${yearParam}-01-01T00:00:00.000Z`;
        const endDate = `${yearParam}-12-31T23:59:59.999Z`;

        const rows = [];
        for (const m of meters) {
          const monthsMap: Record<number, number> = {};
          for (let mo = 1; mo <= 12; mo++) {
            monthsMap[mo] = 0;
          }

          const intervals = await db.prepare(`
            SELECT timestamp, consumption 
            FROM interval_data
            WHERE meterId = ? AND timestamp >= ? AND timestamp <= ?
          `).all(m.meterId, startDate, endDate) as any[];

          for (const inter of intervals) {
            try {
              const dateObj = new Date(inter.timestamp);
              const monthNum = dateObj.getUTCMonth() + 1; // 1-12
              if (monthNum >= 1 && monthNum <= 12) {
                monthsMap[monthNum] = +(monthsMap[monthNum] + (inter.consumption || 0)).toFixed(2);
              }
            } catch (e) {}
          }

          // Intégrer les recharges d'énergie STS livrées au compteur (tokens)
          const meterTokens = await db.prepare(`
            SELECT timestamp, kwh 
            FROM tokens
            WHERE meterId = ? AND timestamp >= ? AND timestamp <= ? AND kwh > 0
          `).all(m.meterId, startDate, endDate) as any[];

          for (const tok of meterTokens) {
            try {
              const dateObj = new Date(tok.timestamp);
              const monthNum = dateObj.getUTCMonth() + 1; // 1-12
              if (monthNum >= 1 && monthNum <= 12) {
                monthsMap[monthNum] = +(monthsMap[monthNum] + (tok.kwh || 0)).toFixed(2);
              }
            } catch (e) {}
          }

          // Extraction dynamique des données réelles de la base
          let zoneName = m.regionId || 'NIAMEY';
          let aliasName = m.location || (m.meterType === 'commercial' ? 'Site Commercial (Triphasé)' : 'Poste Résidentiel (Monophasé)');
          
          if (m.location && m.location.includes('/')) {
            const parts = m.location.split('/');
            zoneName = parts[0].trim().toUpperCase() || zoneName;
            aliasName = parts[1].trim() || aliasName;
          }

          const totalYearKwh = Object.values(monthsMap).reduce((a, b) => a + b, 0);

          rows.push({
            zoneName,
            userName: m.customerName || 'Abonné NIGELEC',
            meterId: m.meterId,
            aliasName,
            year: String(yearParam),
            totalYearKwh: +totalYearKwh.toFixed(2),
            months: monthsMap
          });
        }

        const columnTotals: Record<number, number> = {};
        for (let mo = 1; mo <= 12; mo++) {
          columnTotals[mo] = rows.reduce((sum, r) => sum + (r.months[mo] || 0), 0);
        }

        return res.json({
          success: true,
          mode: 'monthly',
          year: yearParam,
          totalMeters: rows.length,
          columnTotals,
          totalConsolidatedYearKwh: rows.reduce((s, r) => s + r.totalYearKwh, 0),
          rows
        });
      } else {
        // --- RAPPORT QUOTIDIEN (31 JOURS) ---
        const [yearStr, monthStr] = yearMonth.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const daysInMonth = new Date(year, month, 0).getDate();

        const rows = [];
        for (const m of meters) {
          const daysMap: Record<number, number> = {};
          for (let d = 1; d <= 31; d++) {
            daysMap[d] = 0;
          }

          const startDate = `${yearMonth}-01T00:00:00.000Z`;
          const endDate = `${yearMonth}-${String(daysInMonth).padStart(2, '0')}T23:59:59.999Z`;

          const intervals = await db.prepare(`
            SELECT timestamp, consumption 
            FROM interval_data
            WHERE meterId = ? AND timestamp >= ? AND timestamp <= ?
          `).all(m.meterId, startDate, endDate) as any[];

          for (const inter of intervals) {
            try {
              const dateObj = new Date(inter.timestamp);
              const dayNum = dateObj.getUTCDate();
              if (dayNum >= 1 && dayNum <= 31) {
                daysMap[dayNum] = +(daysMap[dayNum] + (inter.consumption || 0)).toFixed(2);
              }
            } catch (e) {}
          }

          // Intégrer les recharges d'énergie STS livrées au compteur (tokens)
          const meterTokens = await db.prepare(`
            SELECT timestamp, kwh 
            FROM tokens
            WHERE meterId = ? AND timestamp >= ? AND timestamp <= ? AND kwh > 0
          `).all(m.meterId, startDate, endDate) as any[];

          for (const tok of meterTokens) {
            try {
              const dateObj = new Date(tok.timestamp);
              const dayNum = dateObj.getUTCDate();
              if (dayNum >= 1 && dayNum <= 31) {
                daysMap[dayNum] = +(daysMap[dayNum] + (tok.kwh || 0)).toFixed(2);
              }
            } catch (e) {}
          }

          // Extraction dynamique des données réelles de la base
          let zoneName = m.regionId || 'NIAMEY';
          let aliasName = m.location || (m.meterType === 'commercial' ? 'Site Commercial (Triphasé)' : 'Poste Résidentiel (Monophasé)');
          
          if (m.location && m.location.includes('/')) {
            const parts = m.location.split('/');
            zoneName = parts[0].trim().toUpperCase() || zoneName;
            aliasName = parts[1].trim() || aliasName;
          }

          const totalMonthKwh = Object.values(daysMap).reduce((a, b) => a + b, 0);

          rows.push({
            zoneName,
            userName: m.customerName || 'Abonné NIGELEC',
            meterId: m.meterId,
            aliasName,
            yearMonth,
            totalMonthKwh: +totalMonthKwh.toFixed(2),
            days: daysMap
          });
        }

        const columnTotals: Record<number, number> = {};
        for (let d = 1; d <= 31; d++) {
          columnTotals[d] = rows.reduce((sum, r) => sum + (r.days[d] || 0), 0);
        }

        return res.json({
          success: true,
          mode: 'daily',
          yearMonth,
          daysInMonth,
          totalMeters: rows.length,
          columnTotals,
          totalConsolidatedMonthKwh: rows.reduce((s, r) => s + r.totalMonthKwh, 0),
          rows
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * 2. GET /api/statistics/meter-analysis
   */
  async getMeterAnalysis(req: Request, res: Response) {
    try {
      const meterId = (req.query.meterId as string) || '0128260224778';
      const yearMonth = (req.query.yearMonth as string) || '2026-08';
      const year = parseInt((req.query.year as string) || yearMonth.substring(0, 4), 10);
      const mode = (req.query.mode as string) || 'daily';

      const meter = await db.prepare("SELECT * FROM meters WHERE id = ?").get(meterId) as any;
      if (!meter) {
        return res.status(404).json({ error: `Compteur ${meterId} introuvable.` });
      }

      if (mode === 'daily') {
        const [currYStr, currMStr] = yearMonth.split('-');
        const currYear = parseInt(currYStr, 10);
        const currMonth = parseInt(currMStr, 10);
        const daysInMonth = new Date(currYear, currMonth, 0).getDate();

        let prevYear = currYear;
        let prevMonth = currMonth - 1;
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear -= 1;
        }
        const prevYearMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

        const currentData = await db.prepare(`
          SELECT timestamp, consumption 
          FROM interval_data
          WHERE meterId = ? AND timestamp >= ? AND timestamp <= ?
        `).all(meterId, `${yearMonth}-01T00:00:00.000Z`, `${yearMonth}-${daysInMonth}T23:59:59.999Z`) as any[];

        const currentTokens = await db.prepare(`
          SELECT timestamp, kwh 
          FROM tokens
          WHERE meterId = ? AND timestamp >= ? AND timestamp <= ? AND kwh > 0
        `).all(meterId, `${yearMonth}-01T00:00:00.000Z`, `${yearMonth}-${daysInMonth}T23:59:59.999Z`) as any[];

        const prevDaysInMonth = new Date(prevYear, prevMonth, 0).getDate();
        const prevData = await db.prepare(`
          SELECT timestamp, consumption 
          FROM interval_data
          WHERE meterId = ? AND timestamp >= ? AND timestamp <= ?
        `).all(meterId, `${prevYearMonth}-01T00:00:00.000Z`, `${prevYearMonth}-${prevDaysInMonth}T23:59:59.999Z`) as any[];

        const prevTokens = await db.prepare(`
          SELECT timestamp, kwh 
          FROM tokens
          WHERE meterId = ? AND timestamp >= ? AND timestamp <= ? AND kwh > 0
        `).all(meterId, `${prevYearMonth}-01T00:00:00.000Z`, `${prevYearMonth}-${prevDaysInMonth}T23:59:59.999Z`) as any[];

        const currentDaysMap: Record<number, number> = {};
        const prevDaysMap: Record<number, number> = {};
        for (let d = 1; d <= 31; d++) {
          currentDaysMap[d] = 0;
          prevDaysMap[d] = 0;
        }

        currentData.forEach(item => {
          const day = new Date(item.timestamp).getUTCDate();
          if (day >= 1 && day <= 31) currentDaysMap[day] += item.consumption || 0;
        });
        currentTokens.forEach(item => {
          const day = new Date(item.timestamp).getUTCDate();
          if (day >= 1 && day <= 31) currentDaysMap[day] += item.kwh || 0;
        });

        prevData.forEach(item => {
          const day = new Date(item.timestamp).getUTCDate();
          if (day >= 1 && day <= 31) prevDaysMap[day] += item.consumption || 0;
        });
        prevTokens.forEach(item => {
          const day = new Date(item.timestamp).getUTCDate();
          if (day >= 1 && day <= 31) prevDaysMap[day] += item.kwh || 0;
        });

        const series = [];
        for (let d = 1; d <= 31; d++) {
          const thisM = +(currentDaysMap[d] || 0).toFixed(2);
          const lastM = +(prevDaysMap[d] || 0).toFixed(2);
          
          let yoyPct = 0;
          if (lastM > 0) {
            yoyPct = +(((thisM - lastM) / lastM) * 100).toFixed(1);
          } else if (thisM > 0) {
            yoyPct = 100.0;
          }

          const dayLabel = d === 1 ? '1er' : `${d}e`;
          series.push({
            dayIndex: d,
            dateLabel: dayLabel,
            thisMonthKwh: thisM,
            lastMonthKwh: lastM,
            yoyRatioPct: yoyPct
          });
        }

        return res.json({
          success: true,
          mode: 'daily',
          meterId,
          yearMonth,
          prevYearMonth,
          daysInMonth,
          series
        });
      } else {
        const MONTH_NAMES = [
          'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];

        const prevYear = year - 1;

        const thisYearData = await db.prepare(`
          SELECT timestamp, consumption 
          FROM interval_data
          WHERE meterId = ? AND timestamp >= ? AND timestamp <= ?
        `).all(meterId, `${year}-01-01T00:00:00.000Z`, `${year}-12-31T23:59:59.999Z`) as any[];

        const thisYearTokens = await db.prepare(`
          SELECT timestamp, kwh 
          FROM tokens
          WHERE meterId = ? AND timestamp >= ? AND timestamp <= ? AND kwh > 0
        `).all(meterId, `${year}-01-01T00:00:00.000Z`, `${year}-12-31T23:59:59.999Z`) as any[];

        const lastYearData = await db.prepare(`
          SELECT timestamp, consumption 
          FROM interval_data
          WHERE meterId = ? AND timestamp >= ? AND timestamp <= ?
        `).all(meterId, `${prevYear}-01-01T00:00:00.000Z`, `${prevYear}-12-31T23:59:59.999Z`) as any[];

        const lastYearTokens = await db.prepare(`
          SELECT timestamp, kwh 
          FROM tokens
          WHERE meterId = ? AND timestamp >= ? AND timestamp <= ? AND kwh > 0
        `).all(meterId, `${prevYear}-01-01T00:00:00.000Z`, `${prevYear}-12-31T23:59:59.999Z`) as any[];

        const thisYearMonths: number[] = new Array(12).fill(0);
        const lastYearMonths: number[] = new Array(12).fill(0);

        thisYearData.forEach(item => {
          const m = new Date(item.timestamp).getUTCMonth();
          thisYearMonths[m] += item.consumption || 0;
        });
        thisYearTokens.forEach(item => {
          const m = new Date(item.timestamp).getUTCMonth();
          thisYearMonths[m] += item.kwh || 0;
        });

        lastYearData.forEach(item => {
          const m = new Date(item.timestamp).getUTCMonth();
          lastYearMonths[m] += item.consumption || 0;
        });
        lastYearTokens.forEach(item => {
          const m = new Date(item.timestamp).getUTCMonth();
          lastYearMonths[m] += item.kwh || 0;
        });

        const series = MONTH_NAMES.map((name, idx) => {
          const thisY = +thisYearMonths[idx].toFixed(2);
          const lastY = +lastYearMonths[idx].toFixed(2);
          let yoyPct = 0;
          if (lastY > 0) {
            yoyPct = +(((thisY - lastY) / lastY) * 100).toFixed(1);
          } else if (thisY > 0) {
            yoyPct = 100.0;
          }

          return {
            monthIndex: idx + 1,
            monthName: name,
            thisYearKwh: thisY,
            lastYearKwh: lastY,
            yoyRatioPct: yoyPct
          };
        });

        return res.json({
          success: true,
          mode: 'monthly',
          meterId,
          year,
          prevYear,
          series
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * 3. GET /api/statistics/financial-summary
   */
  async getFinancialSummary(req: Request, res: Response) {
    try {
      const yearMonth = (req.query.yearMonth as string) || '2026-08';
      const regionId = ((req.query.regionId as string) || 'ALL').toUpperCase();

      const tokens = await db.prepare(`
        SELECT t.*, m.type as meterType, c.regionId 
        FROM tokens t
        LEFT JOIN meters m ON t.meterId = m.id
        LEFT JOIN customers c ON t.customerId = c.id
        WHERE t.timestamp LIKE ?
      `).all(`${yearMonth}%`) as any[];

      const payments = await db.prepare(`
        SELECT p.*, c.regionId 
        FROM payments p
        LEFT JOIN meters m ON p.meterId = m.id
        LEFT JOIN customers c ON m.customerId = c.id
        WHERE p.timestamp LIKE ?
      `).all(`${yearMonth}%`) as any[];

      const totalRevenueFcfa = tokens.reduce((acc, t) => acc + (t.amount || 0), 0);
      const totalKwhVended = tokens.reduce((acc, t) => acc + (t.kwh || 0), 0);
      const avgPricePerKwh = totalKwhVended > 0 ? Math.round(totalRevenueFcfa / totalKwhVended) : 98;

      const vatRate = 0.19;
      const partEnergieHT = Math.round(totalRevenueFcfa / (1 + vatRate));
      const montantTVA = Math.round(totalRevenueFcfa - partEnergieHT);
      const primeFixeTotale = tokens.length * 1500;
      const taxeORTN = Math.round(totalKwhVended * 3);
      const taxeHabitat = tokens.length * 200;

      const operatorMap: Record<string, { count: number; amount: number }> = {
        'ORANGE': { count: 0, amount: 0 },
        'AIRTEL': { count: 0, amount: 0 },
        'NITA': { count: 0, amount: 0 },
        'AMANA': { count: 0, amount: 0 },
        'CASH': { count: 0, amount: 0 }
      };

      payments.forEach(p => {
        const op = (p.operator || 'CASH').toUpperCase();
        let key = 'CASH';
        if (op.includes('ORANGE')) key = 'ORANGE';
        else if (op.includes('AIRTEL')) key = 'AIRTEL';
        else if (op.includes('NITA')) key = 'NITA';
        else if (op.includes('AMANA')) key = 'AMANA';

        operatorMap[key].count++;
        operatorMap[key].amount += p.amount || 0;
      });

      const tariffMap: Record<string, { count: number; amount: number; kwh: number }> = {
        'BT-D': { count: 0, amount: 0, kwh: 0 },
        'BT-P': { count: 0, amount: 0, kwh: 0 },
        'TS': { count: 0, amount: 0, kwh: 0 },
        'MT-G': { count: 0, amount: 0, kwh: 0 },
        'HT': { count: 0, amount: 0, kwh: 0 },
        'EP': { count: 0, amount: 0, kwh: 0 }
      };

      tokens.forEach(t => {
        const type = t.meterType || 'domestic';
        let tKey = 'BT-D';
        if (type === 'social') tKey = 'TS';
        else if (type === 'commercial') tKey = 'BT-P';
        else if (type === 'industrial') tKey = 'MT-G';
        else if (type === 'haute_tension') tKey = 'HT';
        else if (type === 'eclairage_public') tKey = 'EP';

        tariffMap[tKey].count++;
        tariffMap[tKey].amount += t.amount || 0;
        tariffMap[tKey].kwh += t.kwh || 0;
      });

      res.json({
        success: true,
        yearMonth,
        regionId,
        totalRevenueFcfa,
        totalKwhVended,
        avgPricePerKwh,
        taxBreakdown: {
          partEnergieHT,
          montantTVA,
          primeFixeTotale,
          taxeORTN,
          taxeHabitat
        },
        operators: Object.entries(operatorMap).map(([name, data]) => ({
          name,
          count: data.count,
          amount: data.amount,
          percentage: totalRevenueFcfa > 0 ? +((data.amount / totalRevenueFcfa) * 100).toFixed(1) : 0
        })),
        tariffs: Object.entries(tariffMap).map(([name, data]) => ({
          name,
          count: data.count,
          amount: data.amount,
          kwh: data.kwh
        }))
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
