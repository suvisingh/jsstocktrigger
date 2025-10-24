/*
 Simple helper to fetch last 5 days of index history from Yahoo Finance.
 Returns an object keyed by date: { "2025-10-20": { open, high, low, close, volume, adjclose }, ... }.
 Works on Node 18+ (global fetch). For older Node, install node-fetch:
   npm install node-fetch
*/
async function getFetch() {
    if (globalThis.fetch) return globalThis.fetch;
    try {
        const nf = await import('node-fetch');
        return nf.default;
    } catch {
        throw new Error('fetch not available. Use Node 18+ or run: npm install node-fetch');
    }
}

async function getIndexHistory(ticker) {
    if (!ticker) throw new Error('ticker is required');
    const fetch = await getFetch();
    const url = `https://query1.finance.yahoo.com/v7/finance/chart/${encodeURIComponent(ticker)}?range=5d&interval=1d`;
    const res = await fetch(url, { headers: { 'User-Agent': 'jsstocktrigger' } });
    if (!res.ok) throw new Error(`Yahoo Finance request failed: ${res.status} ${res.statusText}`);
    const payload = await res.json();
    const result = payload?.chart?.result?.[0];
    if (!result) throw new Error('No chart result from Yahoo Finance');

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const adj = result.indicators?.adjclose?.[0]?.adjclose || [];

    // build an object keyed by ISO date string
    const map = {};
    timestamps.forEach((t, i) => {
        const date = new Date(t * 1000).toISOString().slice(0, 10);
        map[date] = {
            open: quote.open?.[i] ?? null,
            high: quote.high?.[i] ?? null,
            low: quote.low?.[i] ?? null,
            close: quote.close?.[i] ?? null,
            volume: quote.volume?.[i] ?? null,
            adjclose: adj[i] ?? null
        };
    });

    return map;
}

// convenience: return JSON string of the map
async function getIndexHistoryJSON(ticker) {
    const obj = await getIndexHistory(ticker);
    return JSON.stringify(obj);
}

module.exports = { getIndexHistory, getIndexHistoryJSON };