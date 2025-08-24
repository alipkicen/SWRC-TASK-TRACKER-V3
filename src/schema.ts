// src/schema.ts
import { z } from 'zod';

export const lotSchema = z.object({
  lotId: z.string().min(1),
  unitsQuantity: z.coerce.number().int().nonnegative(),
  serialNumber: z.string().optional().nullable(),
});

export const requestSchema = z.object({
  username: z.string().min(1),
  requestType: z.enum(['Lot Transfer', 'Scrap Request', 'Shipment Request']),
  taskPriority: z.enum(['P1','P2','P3']),
  dateOfRequest: z.coerce.date(),

  // Optional/conditional fields
  facilityLocation: z.string().optional().nullable(),
  receiverName: z.string().optional().nullable(),
  qawrNumber: z.string().optional().nullable(),
  jiraNumber: z.string().optional().nullable(),
  lotLocation: z.string().optional().nullable(),
  attentionTo: z.string().optional().nullable(),
  returnable: z.coerce.boolean().optional().nullable(),
  domesticInternational: z.enum(['Domestic', 'International']).optional().nullable(),
  shippingAddress: z.string().optional().nullable(),

  lots: z.array(lotSchema).min(1, 'At least one lot is required'),
});

export type RequestInput = z.infer<typeof requestSchema>;
