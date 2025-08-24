// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db';
import { requestSchema } from './schema';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/requests', async (req, res) => {
  try {
    // 1) Validate
    const parsed = requestSchema.parse(req.body);

    // 2) Start transaction
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 3) Insert into requests
      const [result] = await conn.execute(
        `
        INSERT INTO requests
          (username, request_type, task_priority, date_of_request,
           facility_location, receiver_name, qawr_number, jira_link, lot_location,
           attention_to, returnable, domestic_international, shipping_address, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, NOW(), NOW())
        `,
        [
          parsed.username,
          parsed.requestType,
          parsed.taskPriority,
          parsed.dateOfRequest,                 // JS Date -> DATETIME
          parsed.facilityLocation ?? null,
          parsed.receiverName ?? null,
          parsed.qawrNumber ?? null,
          parsed.jiraNumber ?? null,            // rename to jiraLink if you prefer
          parsed.lotLocation ?? null,
          parsed.attentionTo ?? null,
          parsed.returnable ?? null,
          parsed.domesticInternational ?? null,
          parsed.shippingAddress ?? null,
        ]
      );

      // @ts-ignore - mysql2 ResultSetHeader has insertId
      const requestId = (result as any).insertId as number;

      // 4) Insert lots (bulk)
      const lotValues = parsed.lots.map(l => [
        requestId, l.lotId, l.unitsQuantity, l.serialNumber ?? null,
      ]);

      const placeholders = lotValues.map(() => '(?,?,?,?)').join(',');
      await conn.query(
        `INSERT INTO lots (request_id, lot_id, units_quantity, serial_number) VALUES ${placeholders}`,
        lotValues.flat()
      );

      await conn.commit();
      res.status(201).json({ id: requestId });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (e: any) {
    // zod or DB error
    console.error(e);
    res.status(400).json({ error: e?.message ?? 'Invalid request' });
  }
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on :${port}`));
