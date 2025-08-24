// schema.ts
// schema.ts (append)
import { z } from "zod";

export const statusEnum = z.enum(["New","In Progress","Completed","Issue"]);

export const requestStatusUpdateSchema = z.object({
  status: statusEnum,
  executor: z.string().min(1).optional().nullable(),
  note: z.string().optional().nullable(),
});
export type RequestStatusUpdateInput = z.infer<typeof requestStatusUpdateSchema>;

/** Shared / base fields (apply to all request types) */
const baseRequest = z.object({
  username: z.string().min(1),
  taskPriority: z.enum(["P1", "P2", "P3"]),
  dateOfRequest: z.coerce.date(),

  facilityLocation: z.string().optional().nullable(),
  receiverName: z.string().optional().nullable(),
  qawrNumber: z.string().optional().nullable(),
  jiraLink: z.string().optional().nullable(),
  lotLocation: z.string().optional().nullable(),
  attentionTo: z.string().optional().nullable(),
  returnable: z.boolean().optional().nullable(),
  domesticInternational: z.enum(["Domestic", "International"]).optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
});

/** Lots for LT / Shipment / Scrap */
const lotSchema = z.object({
  lotId: z.string().min(1),
  unitsQuantity: z.number().int().nonnegative().nullable().optional(),
  serialNumber: z.string().optional().nullable(),
});

/** Sampling lots (per-lot details) */
const samplingLotSchema = z.object({
  lotId: z.string().min(1),
  unitQuantity: z.number().int().positive(),
  reliabilityTest: z.string().min(1),
  testCondition: z.string().min(1),
  attributeToTag: z.string().min(1),
});

/** Individual request-type schemas (discriminated on requestType) */
const lotTransferSchema = baseRequest.extend({
  requestType: z.literal("Lot Transfer"),
  lots: z.array(lotSchema).min(1),
});

const shipmentRequestSchema = baseRequest.extend({
  requestType: z.literal("Shipment Request"),
  lots: z.array(lotSchema).min(1),
});

const scrapRequestSchema = baseRequest.extend({
  requestType: z.literal("Scrap Request"),
  lots: z.array(lotSchema).min(1),
});

const samplingRequestSchema = baseRequest.extend({
  requestType: z.literal("Sampling Request"),
  samplingType: z.string().min(1),
  // Prevent past QR dates (server-side enforcement to match your UI rule)
  qrDate: z.coerce
    .date()
    .refine(d => {
      const t = new Date(); t.setHours(0, 0, 0, 0);
      const q = new Date(d); q.setHours(0, 0, 0, 0);
      return q >= t;
    }, "QR date cannot be in the past"),
  projectName: z.string().min(1),
  samplingLots: z.array(samplingLotSchema).min(1),
});

/** Union */
export const requestSchema = z.discriminatedUnion("requestType", [
  lotTransferSchema,
  shipmentRequestSchema,
  scrapRequestSchema,
  samplingRequestSchema,
]);

/** Types */
export type RequestInput = z.infer<typeof requestSchema>;