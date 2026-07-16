const express = require('express');

const app = express();
app.use(express.json());

// "Database" in memoria
const pietanze = [
  { id: 1, nome: 'Margherita', prezzo: 7.5 },
  { id: 2, nome: 'Carbonara', prezzo: 10.0 },
  { id: 3, nome: 'Tiramisù', prezzo: 5.0 }
];

const ordini = new Map();
let prossimoNumeroOrdine = 1;

// 1) MENU — ritorna la lista delle pietanze, errore se vuota
app.get('/menu', (req, res) => {
  if (pietanze.length === 0) {
    return res.status(500).json({ errore: 'Menu vuoto: il cuoco è scappato' });
  }
  res.json(pietanze);
});

// 2) ORDINE — riceve gli id delle pietanze, stacca un numero d'ordine col conto
app.post('/ordine', (req, res) => {
  const { pietanzeIds } = req.body || {};
  if (!Array.isArray(pietanzeIds) || pietanzeIds.length === 0) {
    return res.status(400).json({ errore: 'Ordine vuoto' });
  }

  const scelte = pietanzeIds.map(id => pietanze.find(p => p.id === id));
  if (scelte.some(p => !p)) {
    return res.status(400).json({ errore: 'Pietanza non presente nel menu' });
  }

  const conto = scelte.reduce((tot, p) => tot + p.prezzo, 0);
  const numeroOrdine = prossimoNumeroOrdine++;
  ordini.set(numeroOrdine, { conto, pagato: false });

  res.status(201).json({ numeroOrdine, conto });
});

// 3) CASSA — paghi l'ordine: se paghi di più ricevi il resto, di meno è errore
app.post('/cassa', (req, res) => {
  const { numeroOrdine, importo } = req.body || {};
  const ordine = ordini.get(numeroOrdine);

  if (!ordine) {
    return res.status(404).json({ errore: 'Ordine non trovato' });
  }
  if (ordine.pagato) {
    return res.status(400).json({ errore: 'Ordine già pagato' });
  }
  if (importo < ordine.conto) {
    return res.status(400).json({ errore: 'Importo insufficiente', mancano: ordine.conto - importo });
  }

  ordine.pagato = true;
  // BUG (fase 1 della demo): il resto è calcolato al contrario!
  // Fix: importo - ordine.conto
  const resto = importo - ordine.conto;

  res.json({ numeroOrdine, resto });
});

module.exports = app;
