import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { SamplingRequestData } from "@/types";

interface RequestSummaryTableProps {
  data: SamplingRequestData;
}

const RequestSummaryTable: React.FC<RequestSummaryTableProps> = ({ data }) => {
  const {
    qawrNumber,
    dateOfRequest,
    username,
    projectName,
    productName,
    formFactor,
    qaProcessType,
    taskPriority,
    remarks,
    samplingLots,
  } = data;

  const lotCount = samplingLots.length;

  if (lotCount === 0) {
    return <p className="mt-8 text-center">No lot details to display.</p>;
  }

  return (
    <div className="mt-8 w-full">
      <h2 className="text-2xl font-bold mb-4 text-center">Request Summary</h2>
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-full text-sm">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="bg-gray-700 text-white border-r">QAWR NUMBER</TableHead>
              <TableHead className="bg-gray-700 text-white border-r">DATE</TableHead>
              <TableHead className="bg-gray-700 text-white border-r">REQUESTOR</TableHead>
              <TableHead className="bg-gray-700 text-white border-r">Project Name</TableHead>
              <TableHead className="bg-gray-700 text-white border-r">Product Name</TableHead>
              <TableHead className="bg-gray-700 text-white border-r">Form Factor</TableHead>
              <TableHead className="bg-gray-700 text-white border-r">LOT ID</TableHead>
              <TableHead className="bg-gray-700 text-white border-r">QTY</TableHead>
              <TableHead className="bg-gray-700 text-white border-r">RELIABILITY TEST</TableHead>
              <TableHead className="bg-gray-700 text-white border-r">Test Condition</TableHead>
              <TableHead className="bg-gray-700 text-white border-r">ATTRIBUTE TO TAG</TableHead>
              <TableHead className="bg-green-700 text-white border-r">QA Process Type</TableHead>
              <TableHead className="bg-red-700 text-white border-r">QA PRIORITY CODE</TableHead>
              <TableHead className="bg-gray-700 text-white">REMARKS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {samplingLots.map((lot, index) => (
              <TableRow key={index}>
                {index === 0 && (
                  <>
                    <TableCell rowSpan={lotCount} className="border-r align-top">{qawrNumber}</TableCell>
                    <TableCell rowSpan={lotCount} className="border-r align-top">{format(dateOfRequest, "PPp")}</TableCell>
                    <TableCell rowSpan={lotCount} className="border-r align-top">{username}</TableCell>
                    <TableCell rowSpan={lotCount} className="border-r align-top">{projectName}</TableCell>
                    <TableCell rowSpan={lotCount} className="border-r align-top">{productName}</TableCell>
                    <TableCell rowSpan={lotCount} className="border-r align-top">{formFactor}</TableCell>
                  </>
                )}
                <TableCell className="border-r">{lot.lotId}</TableCell>
                <TableCell className="border-r">{lot.unitQuantity}</TableCell>
                <TableCell className="border-r">{lot.reliabilityTest}</TableCell>
                <TableCell className="border-r">{lot.testCondition}</TableCell>
                <TableCell className="border-r">{lot.attributeToTag}</TableCell>
                {index === 0 && (
                  <>
                    <TableCell rowSpan={lotCount} className="border-r align-top">{qaProcessType}</TableCell>
                    <TableCell rowSpan={lotCount} className="border-r align-top">{taskPriority}</TableCell>
                    <TableCell rowSpan={lotCount} className="align-top">{remarks || "N/A"}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RequestSummaryTable;