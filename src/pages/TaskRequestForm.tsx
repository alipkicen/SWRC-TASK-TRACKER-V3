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
import { formSchema, FormValues, qaProcessTypes, reliabilityTests } from "@/types";
import RequestSummaryTable from "./RequestSummaryTable";
import { showError, showSuccess } from "@/utils/toast";

const TaskRequestForm = () => {
  const [confirmedData, setConfirmedData] = React.useState<FormValues | null>(null);

  // Sampling request states
  const [motherLotIdInput, setMotherLotIdInput] = React.useState("");
  const [verifiedLotIds, setVerifiedLotIds] = React.useState<string[]>([]);
  const [lotsVerified, setLotsVerified] = React.useState(false);

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

  // Common lot array (used by Lot Transfer / Scrap / Shipment)
  const { fields: commonLotFields, append: appendCommonLot, remove: removeCommonLot } = useFieldArray({
    control: form.control,
    name: "lots" as any,
  });

  // Sampling lot array (used by Sampling Request)
  const { fields: samplingLotFields, append: appendSamplingLot, remove: removeSamplingLot } = useFieldArray({
    control: form.control,
    name: "samplingLots" as any,
  });

  const handleVerifyLots = () => {
    const ids = motherLotIdInput.split(/[\n,]+/).map(id => id.trim()).filter(id => id);
    if (ids.length === 0) {
      showError("Please enter at least one Lot ID.");
      return;
    }
    setVerifiedLotIds(ids);
    setLotsVerified(true);
    showSuccess("Lot IDs verified. You can now assign them to tests.");
  };

  const handleEditLots = () => {
    setLotsVerified(false);
    setVerifiedLotIds([]);
    form.setValue("samplingLots", [] as any);
    showSuccess("You can now edit the Lot IDs. Previously assigned tests have been cleared.");
  };

  const handleGenerateTable = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setConfirmedData(form.getValues());
    } else {
      showError("Please fill all required fields before generating the table.");
    }
  };

// ✅ Drop-in replacement
const onSubmit = (data: FormValues) => {
  console.log("Final form submission:", data);
  alert("Request submitted successfully!");
  setConfirmedData(null);
  setMotherLotIdInput("");
  setVerifiedLotIds([]);
  setLotsVerified(false);
  form.reset({
    username: "",
    requestType: undefined,
    taskPriority: undefined,
    dateOfRequest: new Date(),
  });
};

  const resetOnRequestTypeChange = (value: FormValues['requestType']) => {
    setConfirmedData(null);
    // reset sampling verification state
    setMotherLotIdInput("");
    setVerifiedLotIds([]);
    setLotsVerified(false);
    form.reset({
      ...form.getValues(),
      requestType: value,
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
      // sampling fields
      samplingType: undefined,
      qrDate: undefined,
      projectName: undefined,
      productName: undefined,
      formFactor: undefined,
      qaProcessType: undefined,
      qaPriorityCode: undefined,
      remarks: undefined,
      samplingLots: undefined,
    } as any);
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
                      resetOnRequestTypeChange(value as FormValues['requestType']);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a request type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sampling Request">Sampling Request</SelectItem>
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

          {/* -------- Conditional: Sampling Request -------- */}
          {requestType === "Sampling Request" && (
            <div className="md:col-span-12 border p-4 rounded-md">
              <h2 className="text-xl font-semibold mb-4">Sampling Request Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <FormField control={form.control} name="samplingType" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Sampling Type</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex md:flex-col gap-2">
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="SSD" /></FormControl>
                            <FormLabel className="font-normal">SSD</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="Module" /></FormControl>
                            <FormLabel className="font-normal">Module</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="Component" /></FormControl>
                            <FormLabel className="font-normal">Component</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
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

                <div className="md:col-span-6">
                <FormField
                  control={form.control}
                  name="qrDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>QR Date (Target Qual Completion)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal", // ✅ full width like Input
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <div className="md:col-span-4">
                  <FormField control={form.control} name="projectName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl><Input placeholder="Enter project name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>

                <div className="md:col-span-4">
                  <FormField control={form.control} name="productName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl><Input placeholder="Enter product name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>

                <div className="md:col-span-4">
                  <FormField control={form.control} name="formFactor" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form Factor</FormLabel>
                      <FormControl><Input placeholder="Enter form factor" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>

                <div className="md:col-span-6">
                  <FormField control={form.control} name="qaProcessType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>QA Process Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select QA process type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {qaProcessTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>

                <div className="md:col-span-6">
                  <FormField control={form.control} name="qaPriorityCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>QA Priority Code</FormLabel>
                      <FormControl><Input placeholder="Enter QA priority code" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>

                <div className="md:col-span-12">
                  <FormField control={form.control} name="remarks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl><Textarea placeholder="Any additional remarks" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
              </div>

              {/* Verification of Mother Lot IDs */}
              <div className="mt-4 space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-medium">Verification of Mother Lot ID Attribute</h3>
                <FormItem>
                  <FormLabel>Mother Lot IDs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter Lot IDs, separated by new lines or commas"
                      value={motherLotIdInput}
                      onChange={(e) => setMotherLotIdInput(e.target.value)}
                      disabled={lotsVerified}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <div className="flex gap-2">
                  <Button type="button" onClick={handleVerifyLots} disabled={lotsVerified}>
                    Verify Lots
                  </Button>
                  {lotsVerified && (
                    <Button type="button" variant="outline" onClick={handleEditLots}>
                      Edit Lot IDs
                    </Button>
                  )}
                </div>
              </div>

              {lotsVerified && (
                <div className="space-y-4 mt-4">
                  <h3 className="text-lg font-medium">Individual Lot Details</h3>
                  {samplingLotFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border p-3 rounded-md">
                      <div className="md:col-span-3">
                        <FormField
                          control={form.control}
                          name={`samplingLots.${index}.lotId`}
                          render={({ field: lotField }) => (
                            <FormItem>
                              <FormLabel>Lot ID #{index + 1}</FormLabel>
                              <Select onValueChange={lotField.onChange} defaultValue={lotField.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a verified Lot ID" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {verifiedLotIds.map((id) => (
                                    <SelectItem key={id} value={id}>{id}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <FormField control={form.control} name={`samplingLots.${index}.unitQuantity`} render={({ field: unitsField }) => (
                          <FormItem>
                            <FormLabel>Unit Quantity</FormLabel>
                            <FormControl><Input type="number" placeholder="Enter unit quantity" {...unitsField} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                      </div>
                      <div className="md:col-span-3">
                        <FormField control={form.control} name={`samplingLots.${index}.reliabilityTest`} render={({ field: testField }) => (
                          <FormItem>
                            <FormLabel>Reliability Test</FormLabel>
                            <Select onValueChange={testField.onChange} defaultValue={testField.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select reliability test" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {reliabilityTests.map((test) => (<SelectItem key={test} value={test}>{test}</SelectItem>))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}/>
                      </div>
                      <div className="md:col-span-2">
                        <FormField control={form.control} name={`samplingLots.${index}.testCondition`} render={({ field: conditionField }) => (
                          <FormItem>
                            <FormLabel>Test Condition</FormLabel>
                            <FormControl><Input placeholder="e.g., 85C/85%RH 500hrs" {...conditionField} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                      </div>
                      <div className="md:col-span-2">
                        <FormField control={form.control} name={`samplingLots.${index}.attributeToTag`} render={({ field: attributeField }) => (
                          <FormItem>
                            <FormLabel>Attribute to Tag</FormLabel>
                            <FormControl><Input placeholder="Enter attribute to tag" {...attributeField} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                      </div>
                      <div className="md:col-span-12 flex justify-end">
                        <Button type="button" variant="destructive" onClick={() => removeSamplingLot(index)}>
                          <MinusCircle className="mr-2 h-4 w-4" /> Remove Lot
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" onClick={() => appendSamplingLot({ lotId: "", unitQuantity: "", reliabilityTest: undefined, testCondition: "", attributeToTag: "" })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Sampling Lot
                    </Button>
                    <Button type="button" onClick={handleGenerateTable}>Confirm & Generate Table</Button>
                  </div>
                </div>
              )}
            </div>
          )}

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

      {confirmedData && confirmedData.requestType === "Sampling Request" && (
        <div className="mt-6">
          <RequestSummaryTable data={confirmedData} />
        </div>
      )}
    </div>
  );
};

export default TaskRequestForm;
