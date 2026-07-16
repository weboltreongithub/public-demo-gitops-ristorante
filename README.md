# 🍕 Ristorante Demo — CI con GitHub Actions

Backend demo di un ristorante, usato per mostrare la **Continuous Integration** su GitHub:
ogni push su `main` esegue i test e, **solo se passano**, la build.

📊 **Slide del corso:** [CI con GitHub Actions — Google Slides](https://docs.google.com/presentation/d/15Dye4rwOVbexBtcQD-hd1W7KDG7Z-Pn6qa6EXBRs91U/edit?usp=sharing)

## Le API

| Metodo | Endpoint  | Descrizione |
|--------|-----------|-------------|
| GET    | `/menu`   | Ritorna la lista delle pietanze (errore 500 se il menu è vuoto) |
| POST   | `/ordine` | Riceve gli id delle pietanze, stacca un numero d'ordine con il conto |
| POST   | `/cassa`  | Paghi l'ordine: se paghi di più ricevi il resto, di meno è errore 400 |

### Esempi

```bash
# Menu
curl http://localhost:3000/menu

# Ordine (Margherita + Tiramisù)
curl -X POST http://localhost:3000/ordine \
  -H "Content-Type: application/json" \
  -d '{"pietanzeIds": [1, 3]}'
# → {"numeroOrdine": 1, "conto": 12.5}

# Cassa (paghi 20€, resto 7.50€)
curl -X POST http://localhost:3000/cassa \
  -H "Content-Type: application/json" \
  -d '{"numeroOrdine": 1, "importo": 20}'
```

## Avvio in locale

```bash
npm ci        # installa le dipendenze
npm test      # esegue i test (node --test, test runner nativo di Node.js)
npm start     # avvia il server sulla porta 3000
```

## La pipeline CI

Definita in [`.github/workflows/ci.yml`](.github/workflows/ci.yml), parte a ogni push o pull request su `main`:

```
push su main ──► job "test" ──► job "build" (needs: test) ──► artefatto
                     │
                     └── se un test fallisce, la build NON parte
```

- **test** — checkout, setup Node 24, `npm ci`, `npm test`
- **build** — parte solo se `test` è verde (`needs: test`), produce l'artefatto `ristorante-backend`

## Stack

- **Node.js 24** + **Express** come webserver
- **node:test** (test runner nativo di Node, nessuna dipendenza di test)
- **GitHub Actions** per la CI
