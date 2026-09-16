// Read-only cold-request check: node scripts/check-static-resources.mjs <base-url> [rounds]
// Each round requests all 20 postcards at once; TLS verification is never disabled.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const exec = promisify(execFile);
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:5173/');
const rounds = Number(process.argv[3] ?? 10);
if (!['http:', 'https:'].includes(base.protocol) || !Number.isInteger(rounds) || rounds < 1 || rounds > 100) {
  throw new Error('Expected http(s) base URL and 1–100 rounds');
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const cards = (await readdir(resolve('dist/art/cards'))).filter(name => name.endsWith('.webp')).sort();
const hashes = new Map(await Promise.all(cards.map(async name => [name, sha(await readFile(resolve('dist/art/cards', name)))])));
let passed = 0;
const failures = [];
for (let round = 1; round <= rounds; round++) {
  const results = await Promise.all(cards.map(async name => {
    const url = new URL(`art/cards/${name}`, base);
    url.searchParams.set('queue-check', `${Date.now()}-${round}`);
    try {
      const { stdout } = await exec('curl', ['--fail', '--silent', '--show-error', '--max-time', '15', '--noproxy', base.hostname, url.href], { encoding: 'buffer', maxBuffer: 2 * 1024 * 1024 });
      if (sha(stdout) !== hashes.get(name)) throw new Error('SHA-256 mismatch');
      return null;
    } catch (error) {
      return { round, name, error: String(error.stderr || error.message).trim() };
    }
  }));
  const failed = results.filter(Boolean);
  failures.push(...failed);
  passed += cards.length - failed.length;
  console.log(`Round ${round}: ${cards.length - failed.length}/${cards.length} matching images`);
}
console.log(JSON.stringify({ origin: base.origin, concurrency: cards.length, rounds, passed, failed: failures.length, failures }));
if (failures.length) process.exitCode = 1;
