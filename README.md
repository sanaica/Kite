# Kite – Student Registration System (Vercel Ready)

Modern, frictionless student registration form.  
**No database. No file storage.** Works out of the box on Vercel.

## Project Structure

```
kite-vercel/
├── api/
│   └── register.ts      ← Serverless function (TypeScript)
├── index.html
├── styles.css
├── app.js
├── logo.jpg
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Quick Start (Local)

```bash
# 1. Install dependencies (only needed once)
npm install

# 2. Start the local development server
npx vercel dev
```

> **Important:** Do **not** put `"dev": "vercel dev"` inside `package.json`.  
> That causes the recursive invocation error you saw.

Open the URL that appears (usually http://localhost:3000).

## Deploy to Vercel

### Option A – Dashboard (easiest)
1. Push this folder to a GitHub repository
2. Go to https://vercel.com/new
3. Import the repository → Deploy

### Option B – CLI
```bash
npx vercel
# or for production:
npx vercel --prod
```

## What was fixed
- Removed the `"dev": "vercel dev"` script that caused the recursive error
- No database / no file storage (as requested)
- Clean flat structure – no unnecessary folders
- Frontend (validation, drafts, ID card) kept exactly the same

## Notes
- Student ID format: `KITE-` + 6 random digits
- File upload is validated in the browser but never sent to the server
- All form validation lives in `app.js`
