import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function
 * POST /api/register
 *
 * Accepts student registration data as JSON.
 * Generates a unique Student ID and returns it.
 * No database or file storage — purely ephemeral.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Generate a unique-looking Student ID
        // Format: KITE-XXXXXX (6 random digits)
        const studentId = 'KITE-' + Math.floor(100000 + Math.random() * 900000);

        // Optional: you could inspect req.body here if needed for logging
        // const { email, firstName, lastName, program, term } = req.body || {};

        return res.status(200).json({
            success: true,
            studentId
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error?.message || 'Server error'
        });
    }
}
