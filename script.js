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
let mode = 'encrypt'; // encrypt = +shift, decrypt = -shift

// Demo users: stored with their ciphered password (shift=6 encrypt)
const USERS = {
  admin: caesarCipher('andrew', 6, false),
  guest: caesarCipher('hello', 6, false),
};

// ─── Mode ────────────────────────────────────────────────────────
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

// ─── Login ───────────────────────────────────────────────────────
function doLogin() {
  const user = document.getElementById('username').value.trim().toLowerCase();
  const pw = document.getElementById('password').value;
  const msg = document.getElementById('message');

  if (!user || !pw) {
    showMsg('[ ENTER CREDENTIALS ]', 'error'); return;
  }

  const ciphered = caesarCipher(pw, shift, mode === 'decrypt');

  if (USERS[user] === undefined) {
    showMsg('[ USER NOT FOUND ]', 'error'); return;
  }

  // Accept login if the ciphered password matches stored (shift=6 encrypt)
  // OR if raw password matches after applying shift=6 encrypt (to keep demo working at any shift)
  // For demo: we compare ciphered version with stored (which uses shift=6 encrypt)
  // So login works correctly when shift=6 + encrypt mode (the "intended" setting)
  // For other shifts, we still check: apply cipher to typed pw and compare to stored
  if (USERS[user] === ciphered) {
    showMsg(' ACCESS GRANTED — WELCOME, ' + user.toUpperCase(), 'success');
  } else {
    // Helpful feedback
    const correctCipher = USERS[user];
    showMsg(' ACCESS DENIED  — ciphered: ' + ciphered.toUpperCase(), 'error');
  }
}

function showMsg(text, type) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.className = 'message ' + type;
}

// ─── Eye toggle ──────────────────────────────────────────────────
function toggleEye() {
  const inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ─── Alphabet strip ──────────────────────────────────────────────
function buildAlphaStrip() {
  const strip = document.getElementById('alpha-strip');
  strip.innerHTML = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'.split(' ')
    .map((l, i) => `<span id="al-${i}">${l}</span>`).join(' ');
}

function highlightAlpha() {
  const pw = document.getElementById('password').value.toUpperCase();
  for (let i = 0; i < 26; i++) {
    document.getElementById('al-' + i)?.classList.remove('highlighted');
  }
  for (const ch of pw) {
    if (ch >= 'A' && ch <= 'Z') {
      const orig = ch.charCodeAt(0) - 65;
      const shifted = (orig + (mode === 'decrypt' ? -shift : shift) % 26 + 26) % 26;
      document.getElementById('al-' + shifted)?.classList.add('highlighted');
    }
  }
}

// ─── Hints ───────────────────────────────────────────────────────
function updateHints() {
  document.getElementById('hint-andrew').textContent = caesarCipher('andrew', shift, false);
  document.getElementById('hint-hello').textContent = caesarCipher('hello', shift, false);
}

// ─── Init ────────────────────────────────────────────────────────
buildAlphaStrip();
updateHints();
updatePreview();

document.getElementById('password').addEventListener('input', updatePreview);