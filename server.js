// Simple static file server for the Mintravo website.
// Railway sets the PORT environment variable automatically -- do not hardcode a port.
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CANONICAL_HOST = 'mintravo.com';

// Keep the custom domain as the public URL while retaining Railway's health checks.
app.use((req, res, next) => {
    const host = (req.hostname || '').toLowerCase();
    if (host.endsWith('.up.railway.app')) {
        return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
    }
    next();
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Mintravo site running on port ${PORT}`);
});
