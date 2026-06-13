/**
 * Generates a bcrypt hash for your chosen password.
 *
 * Usage:
 *   node scripts/hash-password.mjs "your-chosen-password"
 *
 * Copy the printed hash into .env as AUTH_PASSWORD_HASH.
 * The plaintext password is never stored anywhere — you just remember it
 * and type it at the login page. Only the hash lives in your env.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your-password"');
  process.exit(1);
}

// Cost factor 12 — a sensible balance of security and speed in 2026.
const hash = await bcrypt.hash(password, 12);
console.log("\nAdd this line to your .env file:\n");
console.log(`AUTH_PASSWORD_HASH='${hash}'`);
console.log("");
