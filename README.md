# Artha Finance OS

**Your money, understood.** A personal finance operating system by Faaz Dev Labs.

Artha brings net worth, cash flow, GST, investments, personal accounting, analytics and a financial assistant into one dark, fast command center.

## What's inside

| Section | What it does |
|---|---|
| Command Center | Net worth, cash, investments, side income, GST, financial radar, insights, quick actions, spending chart |
| Money | Transaction ledger with filters, side-gig tracker, recurring payments, accounts, categories |
| Tax Intelligence | GST estimates (CGST / SGST / IGST), slabs, input-tax-credit status, editable tax ledger |
| Portfolio | Holdings, allocation, gain/loss, price refresh (demo feed) |
| Personal Accounting | Balance sheet, P&L, cash-flow statement, asset and liability registers, double-entry journal |
| Analytics | Category drill-down, trends, transparent financial-health score |
| Artha AI | Answers questions from your ledger and links to the records behind each answer |

Every number is calculated in code from the ledger. The assistant never invents figures; it only routes your question to the right calculation.

## Run it

No build step and no install. Either:

- open `index.html` in a browser, or
- serve the folder: `python3 -m http.server 8080` then visit http://localhost:8080

## Put it online (GitHub Pages)

1. Repo **Settings → Pages**
2. Source: **Deploy from a branch**, branch **main**, folder **/ (root)**
3. Open the URL GitHub gives you. On Android Chrome, use **⋮ → Add to Home screen** to install it like an app.

## Your data

- Entries are saved in the browser on the device you use (localStorage).
- Use **Export backup** on the Command Center to download a JSON file, and **Import backup** to restore it on another device.
- **Reset to demo data** erases your entries and reloads the sample ledger.

## Project layout

```
index.html            app shell
css/styles.css        design tokens and styles
js/format.js          formatting helpers and icons
js/data.js            data model, demo ledger, saving/loading, derived totals
js/charts.js          SVG charts and shared UI pieces
js/views.js           the seven screens
js/assistant.js       question answering from the ledger
js/app.js             overlays, quick add, search, navigation, events
sw.js                 offline support
manifest.webmanifest  install-as-app settings
```

## Notes

- GST figures are estimates. Real filings need actual invoice data, current GST notifications and review by a qualified accountant.
- Market prices come from a demo feed. A live price provider can be plugged in later without changing valuation logic.
