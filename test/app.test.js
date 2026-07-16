const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

// Piccolo helper per chiamare l'app senza dipendenze esterne
function richiesta(server, metodo, percorso, body) {
  return new Promise((resolve, reject) => {
    const dati = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        port: server.address().port,
        method: metodo,
        path: percorso,
        headers: dati
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dati) }
          : {}
      },
      res => {
        let raw = '';
        res.on('data', c => (raw += c));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    );
    req.on('error', reject);
    if (dati) req.write(dati);
    req.end();
  });
}

function conServer(fn) {
  return async () => {
    const server = app.listen(0);
    try {
      await fn(server);
    } finally {
      server.close();
    }
  };
}

test('GET /menu ritorna la lista delle pietanze', conServer(async server => {
  const res = await richiesta(server, 'GET', '/menu');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length > 0, 'il menu non deve essere vuoto');
}));

test('POST /ordine stacca un numero ordine con il conto', conServer(async server => {
  const res = await richiesta(server, 'POST', '/ordine', { pietanzeIds: [1, 3] });
  assert.strictEqual(res.status, 201);
  assert.ok(res.body.numeroOrdine > 0);
  assert.strictEqual(res.body.conto, 12.5); // 7.50 + 5.00
}));

test('POST /ordine con pietanza inesistente dà errore', conServer(async server => {
  const res = await richiesta(server, 'POST', '/ordine', { pietanzeIds: [99] });
  assert.strictEqual(res.status, 400);
}));

test('POST /cassa: pagando di più si riceve il resto', conServer(async server => {
  const ordine = await richiesta(server, 'POST', '/ordine', { pietanzeIds: [2] }); // conto 10.00
  const res = await richiesta(server, 'POST', '/cassa', {
    numeroOrdine: ordine.body.numeroOrdine,
    importo: 20
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.resto, 10, 'con 20€ su un conto di 10€ il resto è 10€');
}));

test('POST /cassa: pagando di meno si ottiene errore', conServer(async server => {
  const ordine = await richiesta(server, 'POST', '/ordine', { pietanzeIds: [2] }); // conto 10.00
  const res = await richiesta(server, 'POST', '/cassa', {
    numeroOrdine: ordine.body.numeroOrdine,
    importo: 5
  });
  assert.strictEqual(res.status, 400);
}));

test('POST /cassa: ordine inesistente dà 404', conServer(async server => {
  const res = await richiesta(server, 'POST', '/cassa', { numeroOrdine: 9999, importo: 50 });
  assert.strictEqual(res.status, 404);
}));
