# Kite - Student Registration System

Kite is a modern student registration web app designed to replace legacy enrollment with a frictionless digital pipeline. Built for speed and clean UX, it allows incoming students to securely submit credentials and course preferences in real-time. 

## Features
- **Frictionless Digital Pipeline:** Securely submit credentials and course preferences in real-time.
- **Dynamic Field Validation:** Every field is checked in `app.ts`. Errors show under the field in red as soon as you leave it, and a popup summary lists everything that needs fixing if you try to submit an incomplete form.
- **Responsive UI:** Clean user experience across all devices to prevent system bottlenecks.
- **Speed & Efficiency:** Replaces legacy enrollment systems with a much faster, modern alternative.

## Validation Rules

| Field | Rule |
|---|---|
| Email | Must be a valid address with a domain, e.g. `student@example.com` |
| Password | 8-64 characters, with an uppercase letter, a lowercase letter, a number and a special character; no spaces |
| First / Last / Emergency name, Relationship | Letters only (spaces, hyphens and apostrophes allowed between letters); first name and contact name need at least 2 letters |
| Date of Birth | Required, on or before 31 Dec 2009 (must have completed high school), and 1900 or later |
| Phone / Emergency phone | Exactly 10 digits, numbers only, starting with 6-9. The emergency number must differ from the student's own number |
| Address | 10-250 characters, must include a street/area name and a 6-digit PIN code |
| Minority Quota, Program, Term | Must be selected |
| Previous Education | Optional; if filled in, at least 3 characters and must include letters |

All of these rules live in one block at the top of `app.ts` (search for "Requirements"), so they are easy to change. For example, to accept international phone numbers, change `PHONE_REGEX` and the length check in `validatePhone`.

## Technologies Used
- HTML5 Forms
- TypeScript
- Custom TypeScript form validation (browser-native validation is switched off with `novalidate`)

## How to Run

1. **Install TypeScript:** 
   If you don't have TypeScript installed globally, you can install it via npm:
   ```bash
   npm install -g typescript
   ```

2. **Compile the TypeScript file:**
   Run the TypeScript compiler to generate the JavaScript file (`app.js`) that the browser can understand. Re-run this every time you edit `app.ts`:
   ```bash
   tsc app.ts
   ```

3. **Open the Application:**
   Simply double-click the `index.html` file to open it in your default web browser, or serve it using a local development server (e.g., Live Server in VS Code).