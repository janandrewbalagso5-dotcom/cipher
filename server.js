// ─── server.js ────────────────────────────────────────────────────
// Entry point — Express server serving the frontend + API routes.
// Run: node server.js  (or: npm run dev  with nodemon)
// ─────────────────────────────────────────────────────────────────
import 'dotenv/config';
import express   from 'express';
import cors      from 'cors';
import path      from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = parseInt(process.env.PORT || '3000');

// ─── Middleware ───────────────────────────────────────────────────
app.use(cors());                          // tighten origin in production
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve static frontend files ──────────────────────────────────
// index.html, style.css, script.js are in the same folder
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ───────────────────────────────────────────────────
app.use('/api', authRouter);

// ─── Fallback: serve index.html for any unmatched route ───────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Server running → http://localhost:${PORT}`);
});