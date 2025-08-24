// server.ts
import express from "express";
import cors from "cors";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "./db";
import { requestSchema, requestStatusUpdateSchema } from "./schema";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Helper: format Date to MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
function toMySqlDateTime(d: unknown): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : (d as Date);
  if (isNaN(date.getTime())) return null;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/** Create request (Lot Transfer, Shipment, Scrap, Sampling) */
app.post("/api/requests", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }
  const data = parsed.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert into requests (includes nullable sampling fields)
    const [result] = await conn.execute<ResultSetHeader>(
      `
      INSERT INTO requests (
        username,
        request_type,
        task_priority,
        date_of_request,
        facility_location,
        receiver_name,
        qawr_number,
        jira_link,
        lot_location,
        attention_to,
        returnable,
        domestic_international,
        shipping_address,
        sampling_type,
        qr_date,
        project_name,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        data.username,
        data.requestType,
        data.taskPriority,
        toMySqlDateTime(data.dateOfRequest),
        data.facilityLocation ?? null,
        data.receiverName ?? null,
        data.qawrNumber ?? null,
        data.jiraLink ?? null,
        data.lotLocation ?? null,
        data.attentionTo ?? null,
        data.returnable ?? null,
        data.domesticInternational ?? null,
        data.shippingAddress ?? null,
        data.requestType === "Sampling Request" ? data.samplingType : null,
        data.requestType === "Sampling Request" ? toMySqlDateTime(data.qrDate) : null,
        data.requestType === "Sampling Request" ? data.projectName : null,
      ]
    );

    const requestId = result.insertId;

    // Insert normal lots (Lot Transfer / Shipment / Scrap)
    if ("lots" in data && Array.isArray((data as any).lots) && (data as any).lots.length > 0) {
      const rows = (data as any).lots.map((l: any) => [
        requestId,
        String(l.lotId).trim(),
        l.unitsQuantity ?? null,
        l.serialNumber ?? null,
      ]);
      await conn.query(
        `INSERT INTO lots (request_id, lot_id, units_quantity, serial_number) VALUES ?`,
        [rows]
      );
    }

    // Insert sampling lots (Sampling Request)
    if (data.requestType === "Sampling Request" && data.samplingLots?.length) {
      const rows = data.samplingLots.map(s => [
        requestId,
        String(s.lotId).trim(),
        Number(s.unitQuantity),
        String(s.reliabilityTest).trim(),
        String(s.testCondition).trim(),
        String(s.attributeToTag).trim(),
      ]);
      await conn.query(
        `INSERT INTO sampling_lots
          (request_id, lot_id, unit_quantity, reliability_test, test_condition, attribute_to_tag)
         VALUES ?`,
        [rows]
      );
    }

    await conn.commit();
    res.json({ id: requestId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Failed to save request" });
  } finally {
    conn.release();
  }
});

/** Update request status (New / In Progress / Completed / Issue) */
app.patch("/api/requests/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const parsed = requestStatusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }
  const { status, executor, note } = parsed.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch current status for history table
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT status FROM requests WHERE id = ?",
      [id]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Request not found" });
    }
    const oldStatus: string | null = (rows[0] as any).status ?? null;

    // Build dynamic UPDATE
    const nowSQL = toMySqlDateTime(new Date())!;
    const fields: string[] = ["status = ?", "updated_at = ?"];
    const values: any[] = [status, nowSQL];

    if (executor !== undefined) {
      fields.push("executor = ?");
      values.push(executor ?? null);
    }
    if (status === "In Progress") {
      fields.push("started_at = COALESCE(started_at, ?)");
      values.push(nowSQL);
    }
    if (status === "Completed") {
      fields.push("completed_at = COALESCE(completed_at, ?)");
      values.push(nowSQL);
    }
    if (status === "Issue") {
      fields.push("issue_note = ?");
      values.push(note ?? null);
    }

    await conn.execute(
      `UPDATE requests SET ${fields.join(", ")} WHERE id = ?`,
      [...values, id]
    );

    // History insert
    await conn.execute<ResultSetHeader>(
      `INSERT INTO request_status_history (request_id, old_status, new_status, executor, note)
       VALUES (?, ?, ?, ?, ?)`,
      [id, oldStatus, status, executor ?? null, note ?? null]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ message: "Failed to update status" });
  } finally {
    conn.release();
  }
});

// Start server
const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
