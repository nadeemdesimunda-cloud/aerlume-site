// Simple static file server for the Aerlume website.
// Railway sets the PORT environment variable automatically -- do not hardcode a port.
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Aerlume site running on port ${PORT}`);
});
