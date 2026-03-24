// ─── routes/auth.js ───────────────────────────────────────────────
// POST /api/login
// POST /api/register
// ─────────────────────────────────────────────────────────────────
import { Router } from 'express';
import bcrypt     from 'bcrypt';
import db         from '../db.js';
import { caesarCipher } from '../cipher.js';

const router = Router();

const MAX_ATTEMPTS    = parseInt(process.env.MAX_ATTEMPTS    || '5');
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_MINUTES || '15');

// ─── Helpers ──────────────────────────────────────────────────────
function getClientIP(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.ip ||
    '0.0.0.0'
  );
}

function validate({ username, password, shift, mode }) {
  if (!username || !password)           return '[ ENTER CREDENTIALS ]';
  if (!['encrypt','decrypt'].includes(mode)) return 'Invalid mode';
  if (shift < 1 || shift > 25)          return 'Shift must be between 1 and 25';
  return null;
}

// ─── POST /api/login ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const username = (req.body.username || '').trim().toLowerCase();
  const password =  req.body.password || '';
  const shift    =  parseInt(req.body.shift ?? 6);
  const mode     =  req.body.mode     || 'encrypt';
  const ip       =  getClientIP(req);

  const err = validate({ username, password, shift, mode });
  if (err) return res.status(400).json({ success: false, message: err });

  try {
    // ── Look up user ──────────────────────────────────────────────
    const [rows] = await db.execute(
      'SELECT id, password_hash, role, login_attempts, locked_until FROM users WHERE username = ?',
      [username]
    );

    if (!rows.length) {
      await db.execute(
        'INSERT INTO login_log (username, ip_address, success, shift_used, mode_used) VALUES (?, ?, 0, ?, ?)',
        [username, ip, shift, mode]
      );
      return res.status(401).json({ success: false, message: '[ USER NOT FOUND ]' });
    }

    const user = rows[0];

    // ── Lockout check ─────────────────────────────────────────────
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(429).json({ success: false, message: '[ ACCOUNT LOCKED — TRY AGAIN LATER ]' });
    }

    // ── Recover plain password from ciphered input ────────────────
    // encrypt mode: user typed plain text, UI showed +shift preview
    // We reverse the shift to recover the original plain password.
    const plain   = caesarCipher(password, shift, mode === 'encrypt');
    const success = await bcrypt.compare(plain, user.password_hash);

    // ── Audit log ─────────────────────────────────────────────────
    await db.execute(
      'INSERT INTO login_log (username, ip_address, success, shift_used, mode_used) VALUES (?, ?, ?, ?, ?)',
      [username, ip, success ? 1 : 0, shift, mode]
    );

    if (success) {
      await db.execute(
        'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
        [user.id]
      );
      return res.json({
        success: true,
        message: `✓ ACCESS GRANTED — WELCOME, ${username.toUpperCase()}`,
        role:    user.role,
      });
    }

    // ── Failed — increment counter / maybe lock ───────────────────
    const attempts = user.login_attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
        .toISOString().slice(0, 19).replace('T', ' ');
      await db.execute(
        'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
        [attempts, lockedUntil, user.id]
      );
      return res.status(429).json({
        success: false,
        message: `[ ACCOUNT LOCKED — ${LOCKOUT_MINUTES} MIN LOCKOUT ]`,
      });
    }

    await db.execute(
      'UPDATE users SET login_attempts = ? WHERE id = ?',
      [attempts, user.id]
    );
    return res.status(401).json({
      success: false,
      message: `[ ACCESS DENIED — ${MAX_ATTEMPTS - attempts} ATTEMPT(S) REMAINING ]`,
    });

  } catch (e) {
    console.error('Login error:', e.message);
    return res.status(500).json({ success: false, message: '[ SERVER ERROR — CONTACT ADMIN ]' });
  }
});

// ─── POST /api/register ───────────────────────────────────────────
router.post('/register', async (req, res) => {
  const username = (req.body.username || '').trim().toLowerCase();
  const password =  req.body.password || '';
  const shift    =  parseInt(req.body.shift ?? 6);
  const mode     =  req.body.mode     || 'encrypt';

  const err = validate({ username, password, shift, mode });
  if (err) return res.status(400).json({ success: false, message: err });

  if (!/^[a-z0-9_]{3,64}$/.test(username)) {
    return res.status(400).json({
      success: false,
      message: 'Username: 3–64 chars, letters/numbers/underscore only',
    });
  }

  // Recover plain password
  const plain = caesarCipher(password, shift, mode === 'encrypt');
  if (plain.length < 4) {
    return res.status(400).json({ success: false, message: 'Password too short (min 4 chars)' });
  }

  try {
    // Check duplicate
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE username = ?', [username]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: '[ USERNAME ALREADY TAKEN ]' });
    }

    const hash = await bcrypt.hash(plain, 12);
    await db.execute(
      'INSERT INTO users (username, password_hash, cipher_shift, role) VALUES (?, ?, ?, ?)',
      [username, hash, shift, 'user']
    );

    return res.status(201).json({
      success: true,
      message: '[ ACCOUNT CREATED — YOU MAY NOW LOGIN ]',
    });

  } catch (e) {
    console.error('Register error:', e.message);
    return res.status(500).json({ success: false, message: '[ SERVER ERROR ]' });
  }
});

export default router;