import { Actor, log } from 'apify';
import { fetchDebtHistory } from './treasury.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { daysBack = 30, maxResults = 30 } = input;

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const DEBT_LOOKUP_EVENT = 'debt-lookup';

const records = await fetchDebtHistory({
    daysBack: Math.min(daysBack, 1825),
    maxResults: Math.min(maxResults, 100),
});

for (const record of records) {
    await Actor.pushData(record);
}

await Actor.charge({ eventName: DEBT_LOOKUP_EVENT });

log.info(`Pushed ${records.length} record(s)`);

await Actor.exit();
