/**
 * End-to-end proof that a stranger can no longer take over a live session.
 *
 * Plays the real attack against a running API + signaling pair:
 *   1. Technician A opens a session and gets a code.
 *   2. Attacker B signs up (signup is open) and gets a valid account token.
 *   3. B tries to enter A's session as the host, the way the old code allowed.
 *
 * Unit tests cover the same rules in services/signaling/src/auth.test.ts. This
 * script exists because those rules only matter once the API, the signaling
 * service and the JWT secrets line up across three processes, which a unit
 * test cannot check.
 *
 * Usage, with the API and signaling running and RESEND_API_KEY unset so the
 * magic link is written to the API log instead of emailed:
 *
 *   node packages/webrtc/scripts/session-security-smoke.mjs /path/to/api.log
 *
 * Expects the API on :4500 and signaling on :4501. Creates throwaway accounts
 * (@lume.test), so point it at a development database, never production.
 */
import { io } from 'socket.io-client';
import { readFileSync } from 'node:fs';

const API = 'http://localhost:4500/v1';
const SIGNALING = 'http://localhost:4501';
const LOG = process.argv[2];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

/** Signs a user in by reading the magic-link the API logged in dev mode. */
async function signIn(email) {
  const before = readFileSync(LOG, 'utf8').length;
  await post('/auth/magic-link', { email });
  // Pino writes asynchronously, so poll rather than assume it has flushed.
  let token = null;
  for (let i = 0; i < 25 && !token; i += 1) {
    await sleep(200);
    const fresh = readFileSync(LOG, 'utf8').slice(before);
    const url = [...fresh.matchAll(/"url":"(https?:[^"]+token=[^"]+)"/g)].pop()?.[1];
    if (url) token = new URL(url).searchParams.get('token');
  }
  if (!token) throw new Error(`no magic link logged for ${email}`);
  const session = await post('/auth/magic-link/callback', { token });
  return session.accessToken;
}

/** Attempts a host handshake and resolves with what the server decided. */
function tryHost(token, sessionCode) {
  return new Promise((resolve) => {
    const socket = io(SIGNALING, {
      transports: ['websocket'],
      auth: { role: 'host', token, sessionCode },
      reconnection: false,
      timeout: 5000,
    });
    const done = (verdict, detail) => {
      socket.close();
      resolve({ verdict, detail });
    };
    socket.on('connect', () => done('ACCEPTED', socket.id));
    socket.on('connect_error', (err) => done('REJECTED', `${err.name}: ${err.message}`));
    setTimeout(() => done('TIMEOUT', 'no answer in 6s'), 6000);
  });
}

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}\n      ${detail}`);
};

console.log('--- preparando ---');
const techToken = await signIn('tecnico-a@lume.test');
const attackerToken = await signIn('atacante-b@lume.test');

const techSession = await post('/sessions', { clientName: 'Cliente Roomly' }, techToken);
const code = techSession.session.code;
console.log(`sessão do técnico: ${code}\n`);
await sleep(1200); // stay under the join/info rate limit

const attackerSession = await post('/sessions', { clientName: 'isca' }, attackerToken);
console.log('--- ataques ---');

// 1. The original hijack: a plain account token plus someone else's code.
let r = await tryHost(attackerToken, code);
check('conta qualquer NAO entra como técnico com o código alheio', r.verdict === 'REJECTED', r.detail);

// 2. A legitimate host token, pointed at a session that is not yours.
r = await tryHost(attackerSession.hostToken, code);
check('credencial de outra sessão NAO serve para esta', r.verdict === 'REJECTED', r.detail);

// 3. The technician's own credential still works.
r = await tryHost(techSession.hostToken, code);
check('o técnico dono entra normalmente', r.verdict === 'ACCEPTED', r.detail);

// 4. The technician's own token cannot be aimed elsewhere either.
r = await tryHost(techSession.hostToken, attackerSession.session.code);
check('nem o técnico pode apontar sua credencial para outra sessão', r.verdict === 'REJECTED', r.detail);

console.log('\n--- expiração e limites ---');

// 5. An ended session stops accepting customers.
await post(`/sessions/${techSession.session.id}/end`, {}, techToken);
await sleep(1200);
const infoRes = await fetch(`${API}/sessions/${code}/info`);
check('sessão encerrada recusa o cliente', infoRes.status === 409 || infoRes.status === 410, `HTTP ${infoRes.status}`);

// 6. Someone else's session cannot be ended by you.
const endRes = await fetch(`${API}/sessions/${attackerSession.session.id}/end`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${techToken}`, 'Content-Type': 'application/json' },
  body: '{}',
});
check('não dá para encerrar sessão de outro técnico', endRes.status === 403, `HTTP ${endRes.status}`);

// 7. Code sweeping is now rate limited.
const fresh = await post('/sessions', {}, techToken);
let blocked = 0;
for (let i = 0; i < 25; i += 1) {
  const res = await fetch(`${API}/sessions/${fresh.session.code}/info`);
  if (res.status === 429) blocked += 1;
}
check('varredura de códigos é bloqueada', blocked > 0, `${blocked} de 25 pedidos bloqueados com 429`);

const failed = results.filter((x) => !x.pass);
console.log(`\n${results.length - failed.length}/${results.length} verificações passaram`);
process.exit(failed.length === 0 ? 0 : 1);
