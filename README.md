# Garmin Analyzer

Analisi avanzata dei tuoi dati Garmin - 100% privacy, 100% gratuito.

## Features

- 📊 **Dashboard metriche** - Statistiche aggregate delle tue attività
- 📈 **Grafici interattivi** - HR, Pace, Cadenza per ogni attività
- 🔒 **Privacy totale** - I dati restano nel browser, nulla viene salvato sui server
- 💾 **Salva/Carica sessione** - Esporta i tuoi dati in JSON per riutilizzarli
- 📱 **PWA** - Installabile come app su mobile e desktop

## Quick Start

### Sviluppo locale

```bash
# Installa dipendenze
npm install

# Avvia dev server
npm run dev

# Apri http://localhost:3000
```

### Deploy su Vercel

1. Push il codice su GitHub
2. Collega il repo a Vercel
3. Deploy automatico

## Come usare

1. **Esporta i dati da Garmin Connect**
   - Vai su [connect.garmin.com](https://connect.garmin.com)
   - Impostazioni → Gestisci i tuoi dati → Esporta dati
   - Riceverai un email con lo ZIP

2. **Carica i file**
   - Trascina lo ZIP nell'area di upload
   - Oppure seleziona file FIT singoli

3. **Analizza**
   - Visualizza le statistiche nella dashboard
   - Esplora i dettagli delle singole attività

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **File handling**: JSZip
- **Storage**: sessionStorage (browser)
- **Deploy**: Vercel

## Struttura Progetto

```
garmin-analyzer/
├── app/
│   ├── page.tsx              # Home + Upload
│   ├── dashboard/page.tsx    # Dashboard
│   ├── activities/[id]/      # Dettaglio attività
│   └── api/parse/route.ts    # API parsing FIT
├── components/
│   ├── Upload/               # DropZone, ProgressBar
│   ├── Dashboard/            # StatsCards, ActivityList
│   ├── Charts/               # Grafici
│   └── Session/              # Salva/Carica
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── storage.ts            # sessionStorage wrapper
│   ├── metrics.ts            # Calcoli metriche
│   └── utils.ts              # Helpers
└── public/
    ├── manifest.json         # PWA manifest
    └── sw.js                 # Service worker
```

## Prossimi sviluppi (Livello 2)

- [ ] Efficienza cardiaca trending
- [ ] Cardiac decoupling analysis
- [ ] TRIMP / Training load
- [ ] TSB (Training Stress Balance)
- [ ] Race predictor personalizzato

## Licenza

MIT
