# Artha Finance OS

**Your money, understood.** A personal finance operating system by Faaz Dev Labs, for Android and the web.

## Install on Android

1. Open the repo's **Releases** page and download the latest `Artha-v1.1.x.apk`.
2. Open it on your phone and allow "Install unknown apps" for your browser or file manager when asked.
3. New versions install over the old one and keep your data.

A new APK is built automatically every time code is pushed to `main` (see **Actions**).

## First launch

Choose one:
- **Start with my own data** — empty ledger. Set your account balances (Money → Accounts), add investments, assets and loans, then log entries.
- **Explore with demo data** — six months of sample entries. Clear it from Command Center any time.
- **Restore a backup** — import an Artha backup file.

## What's inside

| Section | What it does |
|---|---|
| Command Center | Net worth, cash, investments, side income, GST, financial radar, insights, alerts, quick actions, spending chart |
| Money | Ledger with search and filters, edit/delete entries, side-gig tracker, recurring payments, accounts |
| Tax Intelligence | GST estimates (CGST / SGST / IGST), slabs, input-tax-credit status, editable tax ledger |
| Portfolio | Holdings with buy, top-up, price updates and sales (realised gain), allocation, wealth assets |
| Personal Accounting | Balance sheet, P&L, cash-flow statement, asset and liability registers, double-entry journal |
| Analytics | Category drill-down, trends, transparent financial-health score |
| Artha AI | Answers questions from your ledger and links to the records behind each answer |

Every figure is calculated in code from your own entries. The assistant never makes up numbers; it routes your question to the right calculation.

## Your data

- Stored privately on the device. Nothing is sent anywhere.
- **Export backup** (Command Center → Your data) shares a `.json` file you can save to Drive, Files or WhatsApp. **Import backup** restores it on any device.
- GST figures are estimates from categories. Confirm with invoices and a qualified accountant before filing or claiming credit.

## Project layout

```
docs/                   the app (HTML, CSS, JS, fonts) — also works as a website
  js/format.js          dates, number formatting, icons
  js/data.js            data model, demo ledger, saving, totals, insights, alerts
  js/charts.js          charts and shared UI pieces
  js/views.js           the screens
  js/assistant.js       question answering from the ledger
  js/app.js             forms, editing, search, navigation
  js/native.js          Android back button, status bar, backup sharing
android/                Android project (Capacitor)
.github/workflows/      builds the APK and publishes a release
```

## Build it yourself

```
npm ci
npx cap sync android
cd android && ./gradlew assembleRelease
```

Run the web version locally: `npx http-server docs` and open http://localhost:8080.
