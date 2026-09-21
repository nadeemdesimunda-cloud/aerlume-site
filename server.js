// Simple static file server + small API proxy for the Mintravo website.
// Railway sets the PORT environment variable automatically -- do not hardcode a port.
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CANONICAL_HOST = 'mintravo.com';

// Travelpayouts credentials are read from environment variables (set in Railway's
// dashboard under Variables) -- never hardcoded here and never sent to the browser.
const TP_TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
const TP_MARKER = process.env.TRAVELPAYOUTS_MARKER;

// Keep the custom domain as the public URL while retaining Railway's health checks.
app.use((req, res, next) => {
    const host = (req.hostname || '').toLowerCase();
    if (host.endsWith('.up.railway.app')) {
        return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
    }
    next();
});

// Small in-memory cache so we don't hammer Travelpayouts on every page load.
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

async function cachedFetch(key, url) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.time < CACHE_TTL_MS) return hit.data;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Travelpayouts request failed: ${resp.status}`);
    const data = await resp.json();
    cache.set(key, { data, time: Date.now() });
    return data;
}

// Real "cheapest destinations from an origin" data -- powers the Explore section.
app.get('/api/destinations', async (req, res) => {
    if (!TP_TOKEN) return res.status(503).json({ error: 'API not configured yet' });
    const origin = (req.query.origin || 'MAD').toUpperCase();
    const currency = (req.query.currency || 'eur').toLowerCase();
    try {
        const url = `https://api.travelpayouts.com/v1/city-directions?origin=${origin}&currency=${currency}&token=${TP_TOKEN}`;
        const data = await cachedFetch(`dest:${origin}:${currency}`, url);
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: 'Could not reach Travelpayouts' });
    }
});

// Real cheapest-fare data for one specific route -- used on the search results page.
app.get('/api/cheapest', async (req, res) => {
    if (!TP_TOKEN) return res.status(503).json({ error: 'API not configured yet' });
    const origin = (req.query.origin || 'MAD').toUpperCase();
    const destination = (req.query.destination || 'LIS').toUpperCase();
    const currency = (req.query.currency || 'eur').toLowerCase();
    try {
        const url = `https://api.travelpayouts.com/v1/prices/cheap?origin=${origin}&destination=${destination}&currency=${currency}&token=${TP_TOKEN}`;
        const data = await cachedFetch(`cheap:${origin}:${destination}:${currency}`, url);
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: 'Could not reach Travelpayouts' });
    }
});

// Multiple live fares for one route, ordered cheapest first.
app.get('/api/flights', async (req, res) => {
    if (!TP_TOKEN) return res.status(503).json({ error: 'API not configured yet' });
    const origin = String(req.query.origin || 'MAD').trim().toUpperCase();
    const destination = String(req.query.destination || 'LIS').trim().toUpperCase();
    const currency = String(req.query.currency || 'eur').trim().toLowerCase();
    if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || !/^[a-z]{3}$/.test(currency)) {
        return res.status(400).json({ error: 'Invalid flight search parameters' });
    }
    try {
        const params = new URLSearchParams({
            origin,
            destination,
            currency,
            sorting: 'price',
            limit: '10',
            one_way: 'false',
            token: TP_TOKEN,
        });
        const url = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?${params}`;
        const data = await cachedFetch(`flights:${origin}:${destination}:${currency}`, url);
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: 'Could not reach Travelpayouts' });
    }
});

// Real cached hotel prices from Hotellook (part of the Travelpayouts network).
app.get('/api/hotels', async (req, res) => {
    if (!TP_TOKEN) return res.status(503).json({ error: 'API not configured yet' });
    const location = String(req.query.location || 'Lisbon').trim().slice(0, 100);
    const currency = String(req.query.currency || 'eur').trim().toLowerCase();
    if (!location || !/^[a-z]{3}$/.test(currency)) {
        return res.status(400).json({ error: 'Invalid hotel search parameters' });
    }
    try {
        const params = new URLSearchParams({
            location,
            currency,
            limit: '10',
            token: TP_TOKEN,
        });
        const url = `https://engine.hotellook.com/api/v2/cache.json?${params}`;
        const data = await cachedFetch(`hotels:${location.toLowerCase()}:${currency}`, url);
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: 'Could not reach Hotellook' });
    }
});

// Hands the frontend your public marker (safe to expose -- it's how Travelpayouts
// credits bookings to you, not a secret) so booking links can be built client-side.
app.get('/api/marker', (req, res) => {
    res.json({ marker: TP_MARKER || null });
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Mintravo site running on port ${PORT}`);
});
