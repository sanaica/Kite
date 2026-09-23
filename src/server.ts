import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = 3000;

// 1. Database Setup
const db = new sqlite3.Database('./kite_local.db', (err: Error | null) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to local SQLite database.');
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        email TEXT,
        firstName TEXT,
        lastName TEXT,
        phone TEXT,
        program TEXT,
        term TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// 2. Multer Configuration
const upload = multer({ dest: 'uploads/' });

// 3. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Static Asset Routing
app.use(express.static(path.join(process.cwd())));
app.use('/src', express.static(path.join(process.cwd(), 'src')));
app.use('/dist', express.static(path.join(process.cwd(), 'dist')));

// 5. Admin Database Page
app.get('/admin', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'admin.html'));
});

// 6. Fetch All Students API (For Admin View)
app.get('/api/students', (req: Request, res: Response) => {
    db.all('SELECT * FROM students ORDER BY createdAt DESC', [], (err: Error | null, rows: any[]) => {
        if (err) {
            console.error('Database query error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 7. Registration Endpoint
app.post('/api/register', upload.single('marksheet'), (req: Request, res: Response) => {
    const { email, firstName, lastName, phone, program, term } = req.body;
    const studentId = 'KITE-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const sql = `INSERT INTO students (id, email, firstName, lastName, phone, program, term) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [studentId, email, firstName, lastName, phone, program, term], function (this: sqlite3.RunResult, err: Error | null) {
        if (err) {
            console.error('Failed to save student:', err.message);
            return res.status(500).json({ message: 'Database saving failed.' });
        }
        res.json({ success: true, studentId });
    });
});

// 8. Root HTML Fallback
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Kite Server running on http://localhost:${PORT}`);
});