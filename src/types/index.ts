import * as z from "zod";

// Define common schemas for Lot details
export const lotSchema = z.object({
  lotId: z.string().min(1, "Lot ID is required"),
  unitsQuantity: z.string().min(1, "Units quantity is required").regex(/^\d+$/, "Must be a number"),
  serialNumber: z.string().min(1, "Serial number is required"),
});

// Base schema for all requests
export const baseSchema = z.object({
  username: z.string().min(1, "Username is required"),
  requestType: z.enum(["Lot Transfer", "Shipment Request", "Scrap Request"], {
    required_error: "Request type is required",
  }),
  taskPriority: z.enum(["P1", "P2", "P3"], {
    required_error: "Task priority is required",
  }),
  dateOfRequest: z.date({
    required_error: "Date of request is required",
  }),
});

// Conditional schemas using discriminated union for dynamic fields
export const formSchema = baseSchema.and(
  z.discriminatedUnion("requestType", [
    z.object({
      requestType: z.literal("Lot Transfer"),
      facilityLocation: z.string().min(1, "Facility/Location is required"),
      receiverName: z.string().min(1, "Receiver's name is required"),
      qawrNumber: z.string().min(1, "QAWR number is required"),
      lots: z.array(lotSchema).min(1, "At least one lot is required"),
      jiraNumber: z.string().min(1, "JIRA number is required"),
    }),
    z.object({
      requestType: z.literal("Scrap Request"),
      qawrNumber: z.string().min(1, "QAWR number is required"),
      lots: z.array(lotSchema).min(1, "At least one lot is required"),
      lotLocation: z.string().min(1, "Lot location is required"),
    }),
    z.object({
      requestType: z.literal("Shipment Request"),
      attentionTo: z.string().min(1, "Attention to is required"),
      returnable: z.enum(["Yes", "No"], { required_error: "Returnable status is required" }),
      domesticInternational: z.enum(["Domestic", "International"], { required_error: "Shipping type is required" }),
      shippingAddress: z.string().min(1, "Shipping address is required"),
      qawrNumber: z.string().min(1, "QAWR number is required"),
      lots: z.array(lotSchema).min(1, "At least one lot is required"),
      lotLocation: z.string().min(1, "Lot location is required"),
    }),
  ])
);

export type FormValues = z.infer<typeof formSchema>;