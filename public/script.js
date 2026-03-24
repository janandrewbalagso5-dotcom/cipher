// ─── Caesar Cipher ───────────────────────────────────────────────
function caesarCipher(text, shift, decrypt = false) {
  shift = ((decrypt ? -shift : shift) % 26 + 26) % 26;
  return text.split('').map(ch => {
    if (/[a-z]/.test(ch)) return String.fromCharCode((ch.charCodeAt(0) - 97 + shift) % 26 + 97);
    if (/[A-Z]/.test(ch)) return String.fromCharCode((ch.charCodeAt(0) - 65 + shift) % 26 + 65);
    return ch;
  }).join('');
}

// ─── State ───────────────────────────────────────────────────────
let shift = 6;
let mode  = 'encrypt';   // 'encrypt' | 'decrypt'
let tab   = 'login';     // 'login'   | 'register'
let busy  = false;

// ─── API base (adjust path if needed) ───────────────────────────
const API_BASE = '/api';

// ─── Tab ─────────────────────────────────────────────────────────
function setTab(t) {
  tab = t;
  document.getElementById('tab-login').classList.toggle('active', t === 'login');
  document.getElementById('tab-register').classList.toggle('active', t === 'register');
  const btn = document.getElementById('action-btn') || document.getElementById('login-btn');
  if (btn) btn.textContent = t === 'login' ? 'ACCESS SYSTEM' : 'CREATE ACCOUNT';
  const infoBox = document.getElementById('info-box');
  if (infoBox) infoBox.style.display = t === 'login' ? '' : 'none';
  clearMsg();
}

// ─── Mode ─────────────────────────────────────────────────────────
function setMode(m) {
  mode = m;
  document.getElementById('btn-encrypt').classList.toggle('active', m === 'encrypt');
  document.getElementById('btn-decrypt').classList.toggle('active', m === 'decrypt');
  updatePreview();
}

// ─── Shift ───────────────────────────────────────────────────────
function changeShift(delta) {
  shift = Math.max(1, Math.min(25, shift + delta));
  document.getElementById('shift-display').textContent = shift;
  updatePreview();
  updateHints();
  highlightAlpha();
}

// ─── Preview ─────────────────────────────────────────────────────
function updatePreview() {
  const pw = document.getElementById('password').value;
  const ciphered = pw ? caesarCipher(pw, shift, mode === 'decrypt') : '_';
  document.getElementById('cipher-output').textContent = ciphered;
  highlightAlpha();
}

// ─── Eye toggle ──────────────────────────────────────────────────
function toggleEye() {
  const inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ─── Action (Login or Register) ──────────────────────────────────
async function doAction() {
  if (busy) return;

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showMsg('[ ENTER CREDENTIALS ]', 'error');
    return;
  }

  const endpoint = tab === 'login' ? `${API_BASE}/login` : `${API_BASE}/register`;
  const payload  = { username, password, shift, mode };

  setBusy(true);
  clearMsg();

  try {
    const res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    // Guard against empty or non-JSON responses (e.g. PHP not running, 404, 500 HTML page)
    const text = await res.text();
    if (!text) {
      showMsg('[ SERVER RETURNED EMPTY RESPONSE — CHECK PHP IS RUNNING ]', 'error');
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Non-JSON response:', text);
      showMsg('[ SERVER ERROR — UNEXPECTED RESPONSE (CHECK CONSOLE) ]', 'error');
      return;
    }

    showMsg(data.message, data.success ? 'success' : 'error');

    if (data.success && tab === 'login') {
      // Optional: redirect on successful login
      // window.location.href = '/dashboard.php';
    }

  } catch (err) {
    showMsg('[ NETWORK ERROR — SERVER UNREACHABLE ]', 'error');
    console.error(err);
  } finally {
    setBusy(false);
  }
}

// ─── Busy state ──────────────────────────────────────────────────
function setBusy(state) {
  busy = state;
  const btn = document.getElementById('action-btn') || document.getElementById('login-btn');
  if (btn) btn.style.display = state ? 'none' : '';
  const spinner = document.getElementById('spinner');
  if (spinner) spinner.style.display = state ? 'flex' : 'none';
}

// ─── Message ─────────────────────────────────────────────────────
function showMsg(text, type) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.className = 'message ' + type;
}

function clearMsg() {
  const el = document.getElementById('message');
  el.textContent = '';
  el.className = 'message';
}

// ─── Alphabet strip ──────────────────────────────────────────────
function buildAlphaStrip() {
  const strip = document.getElementById('alpha-strip');
  strip.innerHTML = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'
    .split(' ')
    .map((l, i) => `<span id="al-${i}">${l}</span>`)
    .join(' ');
}

function highlightAlpha() {
  const pw = document.getElementById('password').value.toUpperCase();
  for (let i = 0; i < 26; i++) {
    document.getElementById('al-' + i)?.classList.remove('highlighted');
  }
  for (const ch of pw) {
    if (ch >= 'A' && ch <= 'Z') {
      const orig    = ch.charCodeAt(0) - 65;
      const shifted = (orig + (mode === 'decrypt' ? -shift : shift) % 26 + 26) % 26;
      document.getElementById('al-' + shifted)?.classList.add('highlighted');
    }
  }
}

// ─── Hints ───────────────────────────────────────────────────────
function updateHints() {
  const ha = document.getElementById('hint-andrew');
  const hh = document.getElementById('hint-hello');
  if (ha) ha.textContent = caesarCipher('andrew', shift, false);
  if (hh) hh.textContent = caesarCipher('hello',  shift, false);
}

// ─── Enter key support ───────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') doAction();
});

// ─── Init ────────────────────────────────────────────────────────
buildAlphaStrip();
updateHints();
updatePreview();