import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client';

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:kite_local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const studentId = 'KITE-' + Math.floor(100000 + Math.random() * 900000);
        const body = req.body;

        await db.execute({
            sql: `INSERT INTO students (id, email, first_name, last_name, program, term) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                studentId,
                body.email,
                body.firstName,
                body.lastName,
                body.program,
                body.term
            ]
        });

        return res.status(200).json({ success: true, studentId });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
}