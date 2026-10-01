const BASE = 'https://whatsap-api-ashwini.onrender.com';
const ACCT = '1a368950-ba28-4d9b-8050-25d6eef6f01b';
const VERCEL = 'https://whatsap-api-ashwini.vercel.app';

async function probe(label, url, opts = {}) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, opts);
    const txt = await r.text();
    console.log(`\n### ${label} -> ${r.status} (${Date.now() - t0}ms)`);
    console.log(txt.slice(0, 260));
    const acao = r.headers.get('access-control-allow-origin');
    if (acao) console.log('CORS allow-origin:', acao);
  } catch (e) {
    console.log(`\n### ${label} -> FETCH ERROR (${Date.now() - t0}ms): ${e.message}`);
  }
}

(async () => {
  // Health: is the Nest app up at all? (may hit cold start, so allow long time)
  await probe('1. GET / (health, expect "Hello API")', BASE + '/');

  // The endpoints that 404'd through the Vercel proxy:
  await probe('2. GET /api/billing/plans', BASE + '/api/billing/plans');
  await probe('3. GET /api/tags', BASE + '/api/tags', { headers: { 'x-account-id': ACCT } });
  await probe('4. POST /api/contacts/import (route exists?)', BASE + '/api/contacts/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-account-id': ACCT },
    body: JSON.stringify({ fileName: 'x.csv', contacts: [{ name: 'A', phoneNumber: '911234567890' }] }),
  });
  await probe('5. GET /api/whatsapp/settings/status', BASE + '/api/whatsapp/settings/status', { headers: { 'x-account-id': ACCT } });

  // CORS preflight from the Vercel origin (browser will do exactly this)
  console.log('\n### 6. CORS preflight OPTIONS /api/tags with Origin=' + VERCEL);
  try {
    const o = await fetch(BASE + '/api/tags', {
      method: 'OPTIONS',
      headers: { Origin: VERCEL, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,x-account-id' },
    });
    console.log('status:', o.status);
    console.log('allow-origin:', o.headers.get('access-control-allow-origin'));
    console.log('allow-headers:', o.headers.get('access-control-allow-headers'));
    console.log('allow-methods:', o.headers.get('access-control-allow-methods'));
  } catch (e) {
    console.log('preflight error:', e.message);
  }
})();
