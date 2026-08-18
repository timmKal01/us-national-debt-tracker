# US National Debt Tracker — Treasury Fiscal Data

Get the daily US national debt — debt held by the public,
intragovernmental holdings, and total debt outstanding — with
day-over-day change, straight from the official [US Treasury Fiscal
Data API](https://fiscaldata.treasury.gov/).

Built for finance, macro, and policy research teams tracking the debt
trend without pulling Treasury's own CSV/XML exports.

## Input

```json
{
  "daysBack": 30,
  "maxResults": 30
}
```

| Field | Type | Description |
|---|---|---|
| `daysBack` | number | How many of the most recent daily records to return, counting back from today. Treasury publishes on business days only. Default `30`, max `1825` (~5 years). |
| `maxResults` | number | Maximum number of daily records to return. Default `30`, max `100`. |

## Output

One record per business day, newest first:

```json
{
  "date": "2026-08-14",
  "debtHeldByPublicUsd": 32200393497585.51,
  "intragovernmentalHoldingsUsd": 7733240968527.27,
  "totalDebtUsd": 39933634466112.78,
  "dayOverDayChangeUsd": -1181741731.59
}
```

`dayOverDayChangeUsd` is the change in total debt versus the prior
business day in the same result set (`null` for the oldest record
returned, since there's nothing earlier to compare against in that
batch).

## How it works

Direct calls to the official [US Treasury Fiscal Data
API](https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny)
(`Debt to the Penny` dataset) — no proxy, no key, no scraping. Public
US government data, updated each business day.

## Pricing note

Billed per **lookup** (one run), not per record returned — one charge
whether you request 1 day or 100.

## Related products

- [Economic Indicator Lookup](https://github.com/timmKal01/economic-indicator-lookup) — broader World Bank macro indicators, not US-specific daily debt
