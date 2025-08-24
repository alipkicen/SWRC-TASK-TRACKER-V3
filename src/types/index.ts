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
  requestType: z.enum(["Sampling Request", "Lot Transfer", "Shipment Request", "Scrap Request"], {
    required_error: "Request type is required",
  }),
  taskPriority: z.enum(["P1", "P2", "P3"], {
    required_error: "Task priority is required",
  }),
  dateOfRequest: z.date({
    required_error: "Date of request is required",
  }),
});

export const qaProcessTypes = ["NPI", "PKG SAFE LAUNCH", "SWR", "CCB", "NPP", "EXCURSION", "EMST"] as const;
export const reliabilityTests = [
  "THB 85/85",
  "HAST 110C",
  "TEMP CYCLE N",
  "TEMP CYCLE K",
  "TEMP CYCLE J",
  "RANDOM VIBRATION",
  "BUMP",
  "OPS RANDOM VIBRATION",
  "MECHANICAL SHOCK",
  "OPS SHOCK",
  "BEND",
  "TORSION",
  "VIBRATION TEMP CYCLE"
] as const;

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
    z.object({
      requestType: z.literal("Sampling Request"),
      samplingType: z.enum(["SSD", "Module", "Component"], { required_error: "Sampling type is required" }),
      qawrNumber: z.string().min(1, "QAWR number is required"),
      qrDate: z.date({ required_error: "QR Date is required" }),
      projectName: z.string().min(1, "Project name is required"),
      productName: z.string().min(1, "Product name is required"),
      formFactor: z.string().min(1, "Form factor is required"),
      qaProcessType: z.enum(qaProcessTypes, { required_error: "QA Process Type is required" }),
      qaPriorityCode: z.string().min(1, "QA Priority Code is required"),
      remarks: z.string().optional(),
      samplingLots: z.array(z.object({
        lotId: z.string().min(1, "Lot ID is required"),
        unitQuantity: z.string().min(1, "Unit quantity is required").regex(/^\d+$/, "Must be a number"),
        reliabilityTest: z.enum(reliabilityTests, { required_error: "Reliability test is required" }),
        testCondition: z.string().min(1, "Test condition is required"),
        attributeToTag: z.string().min(1, "Attribute to tag is required"),
      })).min(1, "At least one sampling lot is required"),
    }),
  ])
);

export type FormValues = z.infer<typeof formSchema>;

// Extract the specific type for the summary table
export type SamplingRequestData = Extract<FormValues, { requestType: "Sampling Request" }>;