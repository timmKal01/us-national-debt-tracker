const BASE_URL = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny';

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

async function fetchWithRetry(url) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(url, { headers: { Connection: 'close' }, signal: controller.signal });
        } catch (err) {
            lastError = err.name === 'AbortError' ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`) : err;
            if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
            continue;
        } finally {
            clearTimeout(timeoutId);
        }
        if (res.ok) return res;
        if (!TRANSIENT_STATUSES.has(res.status)) {
            throw new Error(`Treasury Fiscal Data API request failed: ${res.status} ${res.statusText}`);
        }
        lastError = new Error(`Treasury Fiscal Data API request failed: ${res.status} ${res.statusText}`);
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
    throw lastError;
}

export async function fetchDebtHistory({ daysBack, maxResults }) {
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const url = new URL(BASE_URL);
    url.searchParams.set('filter', `record_date:gte:${formatDate(startDate)}`);
    url.searchParams.set('sort', '-record_date');
    url.searchParams.set('page[size]', String(Math.min(maxResults, 100)));

    const res = await fetchWithRetry(url);
    const body = await res.json();
    const rows = body.data ?? [];

    return rows.map((row, i) => {
        const prior = rows[i + 1]; // rows are newest-first, so the next entry is the prior business day
        const totalDebt = Number(row.tot_pub_debt_out_amt);
        const priorTotalDebt = prior ? Number(prior.tot_pub_debt_out_amt) : null;

        return {
            date: row.record_date,
            debtHeldByPublicUsd: Number(row.debt_held_public_amt),
            intragovernmentalHoldingsUsd: Number(row.intragov_hold_amt),
            totalDebtUsd: totalDebt,
            dayOverDayChangeUsd: priorTotalDebt !== null ? totalDebt - priorTotalDebt : null,
        };
    });
}
