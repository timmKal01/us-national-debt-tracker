const BASE_URL = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny';

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

export async function fetchDebtHistory({ daysBack, maxResults }) {
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const url = new URL(BASE_URL);
    url.searchParams.set('filter', `record_date:gte:${formatDate(startDate)}`);
    url.searchParams.set('sort', '-record_date');
    url.searchParams.set('page[size]', String(Math.min(maxResults, 100)));

    const res = await fetch(url, { headers: { Connection: 'close' } });
    if (!res.ok) {
        throw new Error(`Treasury Fiscal Data API request failed: ${res.status} ${res.statusText}`);
    }
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
