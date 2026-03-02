// ─── cipher.js ────────────────────────────────────────────────────
// Shared Caesar cipher used by both server routes and frontend.
// ─────────────────────────────────────────────────────────────────

/**
 * Apply a Caesar cipher to a string.
 * @param {string} text
 * @param {number} shift  1–25
 * @param {boolean} decrypt  true = reverse the shift
 * @returns {string}
 */
export function caesarCipher(text, shift, decrypt = false) {
  shift = ((decrypt ? -shift : shift) % 26 + 26) % 26;
  return text.split('').map(ch => {
    if (/[a-z]/.test(ch)) return String.fromCharCode((ch.charCodeAt(0) - 97 + shift) % 26 + 97);
    if (/[A-Z]/.test(ch)) return String.fromCharCode((ch.charCodeAt(0) - 65 + shift) % 26 + 65);
    return ch;
  }).join('');
}