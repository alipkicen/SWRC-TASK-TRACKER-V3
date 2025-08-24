import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, MinusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { formSchema, FormValues } from "@/types";
import { showError, showSuccess } from "@/utils/toast";

// Put this below your import lines
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TaskRequestForm = () => {
  const [confirmedData, setConfirmedData] = React.useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      requestType: undefined,
      taskPriority: undefined,
      dateOfRequest: new Date(),
    },
  });

  const requestType = form.watch("requestType");

  const { fields: commonLotFields, append: appendCommonLot, remove: removeCommonLot } = useFieldArray({
    control: form.control,
    name: "lots" as any,
  });

const onSubmit = async (data: FormValues) => {
  try {
    // Prepare payload: ensure date is a Date and unitsQuantity is a number
    const payload = {
      ...data,
      dateOfRequest: data.dateOfRequest ? new Date(data.dateOfRequest) : new Date(),
      lots: (data.lots ?? []).map((l) => ({
        lotId: l.lotId,
        unitsQuantity: Number(l.unitsQuantity),
        serialNumber: l.serialNumber || null,
      })),
    };

    // If you added API_BASE above, use `${API_BASE}`; otherwise hardcode the URL
    const res = await fetch(`${API_BASE}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Submit failed (HTTP ${res.status})`);
    }

    const json = await res.json();
    showSuccess(`Request submitted successfully. ID: ${json.id}`);
    setConfirmedData(null);

    form.reset({
      username: "",
      requestType: undefined,
      taskPriority: undefined,
      dateOfRequest: new Date(),
    });
  } catch (e: any) {
    console.error(e);
    showError(e.message || "Submission failed");
  }
};


return (
  <div className="container mx-auto px-6 py-8 max-w-6xl">
    <h1 className="text-3xl font-bold mb-6 text-center">SWRC Task Request Form</h1>

    <Form {...form}>
      {/* Root becomes a responsive grid */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* -------- Common Fields (landscape) -------- */}
        <div className="md:col-span-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="md:col-span-3">
          <FormField
            control={form.control}
            name="requestType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Request Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setConfirmedData(null);
                    form.reset({
                      ...form.getValues(),
                      requestType: value as FormValues['requestType'],
                      facilityLocation: undefined,
                      receiverName: undefined,
                      qawrNumber: undefined,
                      lots: undefined,
                      jiraNumber: undefined,
                      lotLocation: undefined,
                      attentionTo: undefined,
                      returnable: undefined,
                      domesticInternational: undefined,
                      shippingAddress: undefined,
                    });
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a request type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Lot Transfer">Lot Transfer</SelectItem>
                    <SelectItem value="Shipment Request">Shipment Request</SelectItem>
                    <SelectItem value="Scrap Request">Scrap Request</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="md:col-span-3">
          <FormField
            control={form.control}
            name="taskPriority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="P1">P1</SelectItem>
                    <SelectItem value="P2">P2</SelectItem>
                    <SelectItem value="P3">P3</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* -------- Conditional: Lot Transfer -------- */}
        {requestType === "Lot Transfer" && (
          <div className="md:col-span-12 border p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-4">Lot Transfer Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <FormField control={form.control} name="facilityLocation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility/Location to Pass To</FormLabel>
                    <FormControl><Input placeholder="Enter facility/location" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>

              <div className="md:col-span-4">
                <FormField control={form.control} name="receiverName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receiver's Name</FormLabel>
                    <FormControl><Input placeholder="Enter receiver's name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>

              <div className="md:col-span-4">
                <FormField control={form.control} name="qawrNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>QAWR Number</FormLabel>
                    <FormControl><Input placeholder="Enter QAWR number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>

              {/* Lot Details */}
              <div className="md:col-span-12 space-y-3">
                <h3 className="text-lg font-medium">Lot Details</h3>

                {commonLotFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border p-3 rounded-md">
                    <div className="md:col-span-4">
                      <FormField
                        control={form.control}
                        name={`lots.${index}.lotId`}
                        render={({ field: lotField }) => (
                          <FormItem>
                            <FormLabel>Lot ID #{index + 1}</FormLabel>
                            <FormControl><Input placeholder="Enter Lot ID" {...lotField} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`lots.${index}.unitsQuantity`}
                        render={({ field: unitsField }) => (
                          <FormItem>
                            <FormLabel>Units Quantity</FormLabel>
                            <FormControl><Input type="number" placeholder="Enter units quantity" {...unitsField} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`lots.${index}.serialNumber`}
                        render={({ field: serialField }) => (
                          <FormItem>
                            <FormLabel>Serial Number</FormLabel>
                            <FormControl><Input placeholder="Enter serial number" {...serialField} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2 flex items-end">
                      <Button type="button" variant="destructive" onClick={() => removeCommonLot(index)}>
                        <MinusCircle className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={() => appendCommonLot({ lotId: "", unitsQuantity: "", serialNumber: "" })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Lot
                </Button>
              </div>

              <div className="md:col-span-6">
                <FormField control={form.control} name="jiraNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>JIRA Link</FormLabel>
                    <FormControl><Input placeholder="Enter JIRA link" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
            </div>
          </div>
        )}

        {/* -------- Conditional: Scrap Request -------- */}
        {requestType === "Scrap Request" && (
          <div className="md:col-span-12 border p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-4">Scrap Request Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <FormField control={form.control} name="qawrNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>QAWR Number</FormLabel>
                    <FormControl><Input placeholder="Enter QAWR number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>

              <div className="md:col-span-12 space-y-3">
                <h3 className="text-lg font-medium">Lot Details</h3>

                {commonLotFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border p-3 rounded-md">
                    <div className="md:col-span-4">
                      <FormField control={form.control} name={`lots.${index}.lotId`} render={({ field: lotField }) => (
                        <FormItem>
                          <FormLabel>Lot ID #{index + 1}</FormLabel>
                          <FormControl><Input placeholder="Enter Lot ID" {...lotField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>
                    <div className="md:col-span-3">
                      <FormField control={form.control} name={`lots.${index}.unitsQuantity`} render={({ field: unitsField }) => (
                        <FormItem>
                          <FormLabel>Units Quantity</FormLabel>
                          <FormControl><Input type="number" placeholder="Enter units quantity" {...unitsField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>
                    <div className="md:col-span-3">
                      <FormField control={form.control} name={`lots.${index}.serialNumber`} render={({ field: serialField }) => (
                        <FormItem>
                          <FormLabel>Serial Number</FormLabel>
                          <FormControl><Input placeholder="Enter serial number" {...serialField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <Button type="button" variant="destructive" onClick={() => removeCommonLot(index)}>
                        <MinusCircle className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={() => appendCommonLot({ lotId: "", unitsQuantity: "", serialNumber: "" })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Lot
                </Button>
              </div>

              <div className="md:col-span-6">
                <FormField control={form.control} name="lotLocation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Location</FormLabel>
                    <FormControl><Input placeholder="Enter lot location" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
            </div>
          </div>
        )}

        {/* -------- Conditional: Shipment Request -------- */}
        {requestType === "Shipment Request" && (
          <div className="md:col-span-12 border p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-4">Shipment Request Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <FormField control={form.control} name="attentionTo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attention To</FormLabel>
                    <FormControl><Input placeholder="Enter recipient's name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>

              <div className="md:col-span-2">
                <FormField control={form.control} name="returnable" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Returnable</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Yes/No" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>

              <div className="md:col-span-3">
                <FormField control={form.control} name="domesticInternational" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domestic/International</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Domestic">Domestic</SelectItem>
                        <SelectItem value="International">International</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>

              <div className="md:col-span-3">
                <FormField control={form.control} name="qawrNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>QAWR Number</FormLabel>
                    <FormControl><Input placeholder="Enter QAWR number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>

              <div className="md:col-span-12">
                <FormField control={form.control} name="shippingAddress" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Address</FormLabel>
                    <FormControl><Textarea placeholder="Enter shipping address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>

              {/* Lot Details */}
              <div className="md:col-span-12 space-y-3">
                <h3 className="text-lg font-medium">Lot Details</h3>

                {commonLotFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border p-3 rounded-md">
                    <div className="md:col-span-4">
                      <FormField control={form.control} name={`lots.${index}.lotId`} render={({ field: lotField }) => (
                        <FormItem>
                          <FormLabel>Lot ID #{index + 1}</FormLabel>
                          <FormControl><Input placeholder="Enter Lot ID" {...lotField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>
                    <div className="md:col-span-3">
                      <FormField control={form.control} name={`lots.${index}.unitsQuantity`} render={({ field: unitsField }) => (
                        <FormItem>
                          <FormLabel>Units Quantity</FormLabel>
                          <FormControl><Input type="number" placeholder="Enter units quantity" {...unitsField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>
                    <div className="md:col-span-3">
                      <FormField control={form.control} name={`lots.${index}.serialNumber`} render={({ field: serialField }) => (
                        <FormItem>
                          <FormLabel>Serial Number</FormLabel>
                          <FormControl><Input placeholder="Enter serial number" {...serialField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <Button type="button" variant="destructive" onClick={() => removeCommonLot(index)}>
                        <MinusCircle className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={() => appendCommonLot({ lotId: "", unitsQuantity: "", serialNumber: "" })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Lot
                </Button>
              </div>

              <div className="md:col-span-6">
                <FormField control={form.control} name="lotLocation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Location</FormLabel>
                    <FormControl><Input placeholder="Enter lot location" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
            </div>
          </div>
        )}

        {/* Submit aligned right on wide screens */}
        <div className="md:col-span-12 flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Form>
  </div>
);

};

export default TaskRequestForm;