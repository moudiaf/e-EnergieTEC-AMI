import { useState, useCallback } from 'react';
import { Customer, Meter, Token, Tariff, Alert, Region, Audit, Invoice, Ticket, Payment, AlertRule, DCU, Shift, EnergyBalance } from '../types';

export const useData = (authFetch: any) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dcus, setDcus] = useState<DCU[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cRes, mRes, tRes, rRes, aRes, auRes, iRes, tkRes, pRes, dRes] = await Promise.all([
        authFetch('/api/customers'),
        authFetch('/api/meters'),
        authFetch('/api/tokens'),
        authFetch('/api/regions'),
        authFetch('/api/alerts'),
        authFetch('/api/audits'),
        authFetch('/api/invoices'),
        authFetch('/api/tickets'),
        authFetch('/api/payments'),
        authFetch('/api/dcus')
      ]);

      if (cRes.ok) setCustomers(await cRes.json());
      if (mRes.ok) setMeters(await mRes.json());
      if (tRes.ok) setTokens(await tRes.json());
      if (rRes.ok) setRegions(await rRes.json());
      if (aRes.ok) setAlerts(await aRes.json());
      if (auRes.ok) setAudits(await auRes.json());
      if (iRes.ok) setInvoices(await iRes.json());
      if (tkRes.ok) setTickets(await tkRes.json());
      if (pRes.ok) setPayments(await pRes.json());
      if (dRes.ok) setDcus(await dRes.json());
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  return {
    customers, setCustomers,
    meters, setMeters,
    tokens, setTokens,
    regions, setRegions,
    alerts, setAlerts,
    audits, setAudits,
    invoices, setInvoices,
    tickets, setTickets,
    payments, setPayments,
    dcus, setDcus,
    isLoading, fetchData
  };
};
