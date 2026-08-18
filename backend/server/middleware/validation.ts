import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// ======================================================================
// SCHEMAS DE VALIDATION ZOD
// ======================================================================

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Nom d'utilisateur requis"),
  password: z.string().trim().min(1, "Mot de passe requis")
});

export const customerCreateSchema = z.object({
  id: z.string().trim().min(1, "ID client requis"),
  name: z.string().trim().min(1, "Nom du client requis"),
  email: z.string().email("Format d'email invalide").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  type: z.enum(['domestic', 'social', 'commercial', 'industrial']).default('domestic'),
  address: z.string().trim().optional(),
  regionId: z.string().trim().optional()
});

export const meterCreateSchema = z.object({
  id: z.string().trim().min(1, "ID du compteur requis"),
  serialNumber: z.string().trim().min(1, "Numéro de série du compteur requis"),
  location: z.string().trim().optional(),
  type: z.enum(['domestic', 'commercial', 'industrial', 'haute_tension']).default('domestic'),
  credit: z.number().nonnegative().optional().default(0),
  status: z.enum(['online', 'warning', 'offline']).optional().default('online'),
  dcuId: z.string().trim().optional().nullable(),
  phaseType: z.enum(['monophase', 'triphase']).optional().default('monophase'),
  supplier: z.string().trim().optional()
});

export const tokenGenerateSchema = z.object({
  meterId: z.string().trim().min(1, "ID du compteur requis"),
  kwh: z.number().optional(),
  type: z.enum(['recharge', 'clear-credit', 'clear-tamper', 'key-change'])
}).refine(data => {
  if (data.type === 'recharge') {
    return data.kwh !== undefined && data.kwh > 0;
  }
  return true;
}, {
  message: "La valeur en kWh doit être supérieure à 0 pour une recharge",
  path: ["kwh"]
});

export const alertCreateSchema = z.object({
  type: z.string().trim().min(1, "Type d'alerte requis"),
  title: z.string().trim().min(1, "Titre d'alerte requis"),
  message: z.string().trim().min(1, "Message d'alerte requis"),
  meterId: z.string().trim().min(1, "ID du compteur requis")
});

export const paymentCreateSchema = z.object({
  id: z.string().trim().optional(),
  amount: z.number().positive("Le montant doit être supérieur à 0"),
  operator: z.string().trim().min(1, "Opérateur requis"),
  phone: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  meterId: z.string().trim().min(1, "ID du compteur requis"),
  tokenId: z.string().trim().optional().nullable(),
  status: z.string().trim().default('Success'),
  timestamp: z.string().trim().optional()
});

export const ticketCreateSchema = z.object({
  id: z.string().trim().min(1, "ID du ticket requis"),
  subject: z.string().trim().min(1, "Sujet requis"),
  description: z.string().trim().min(1, "Description requise"),
  customerId: z.string().trim().optional().nullable(),
  meterId: z.string().trim().optional().nullable(),
  status: z.enum(['Nouveau', 'Ouvert', 'En attente', 'Résolu']).default('Nouveau'),
  priority: z.enum(['Basse', 'Moyenne', 'Haute', 'Critique']).default('Moyenne'),
  assignedTo: z.string().trim().optional().default('Technicien Réseau'),
  timestamp: z.string().trim().optional()
});

export const regionCreateSchema = z.object({
  id: z.string().trim().min(1, "ID de la région requis"),
  superiorRegionId: z.string().trim().optional().nullable(),
  areaName: z.string().trim().min(1, "Nom de la région requis"),
  label: z.number().int().default(1),
  principal: z.string().trim().optional(),
  contact: z.string().trim().optional(),
  email: z.string().email("Format d'email invalide").optional().or(z.literal("")),
  status: z.enum(['enabled', 'disabled']).default('enabled'),
  blazon: z.string().trim().optional()
});

export const dcuCreateSchema = z.object({
  id: z.string().trim().min(1, "ID du DCU requis"),
  name: z.string().trim().min(1, "Nom du DCU requis"),
  regionId: z.string().trim().min(1, "ID de la région requis"),
  status: z.enum(['active', 'inactive']).default('active'),
  ipAddress: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, "Format d'adresse IP invalide").optional().or(z.literal("")),
  macAddress: z.string().trim().optional(),
  firmware: z.string().trim().optional(),
  lastPing: z.string().trim().optional(),
  performance: z.number().optional().default(100),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  modemType: z.string().trim().optional().default('GPRS'),
  signalStrength: z.number().optional().default(80),
  connectedMeters: z.number().optional().default(0)
});

// ======================================================================
// GENERATEUR DE MIDDLEWARE DE VALIDATION
// ======================================================================

export const validateBody = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errorMsg = result.error.issues.map(err => err.message).join(', ');
    return res.status(400).json({ 
      success: false, 
      message: `Erreur de validation : ${errorMsg}`, 
      errors: result.error.issues 
    });
  }
  req.body = result.data; // Réassigne les données nettoyées et typées
  next();
};

// ======================================================================
// MIDDLEWARES DE VALIDATION COMPATIBLES (BACKWARD COMPATIBILITY)
// ======================================================================

export const validateLogin = validateBody(loginSchema);
export const validateCustomerCreate = validateBody(customerCreateSchema);
export const validateMeterCreate = validateBody(meterCreateSchema);
export const validateTokenGenerate = validateBody(tokenGenerateSchema);
export const validateAlertCreate = validateBody(alertCreateSchema);
export const validatePaymentCreate = validateBody(paymentCreateSchema);
export const validateTicketCreate = validateBody(ticketCreateSchema);
export const validateRegionCreate = validateBody(regionCreateSchema);
export const validateDcuCreate = validateBody(dcuCreateSchema);
