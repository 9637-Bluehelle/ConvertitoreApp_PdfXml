// server.js (Node.js + Express)
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

app.use(cors()); 
app.get('/api/exchange-rate', async (req, res) => {
  const { fromCurrency, date } = req.query;

  if (!fromCurrency || !date) {
    return res.status(400).json({ error: 'Parametri mancanti' });
  }

  try {
    const url = `https://www.x-rates.com/historical/?from=EUR&amount=1&date=${date}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Errore nel fetching dati' });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const rates = { Euro: 1 };

    // la tabella con i tassi è la seconda tbody
    const tableRows = $('tbody').eq(1).find('tr');
    tableRows.each((_, row) => {
      const columns = $(row).find('td');
      if (columns.length >= 2) {
        const currencyName = $(columns[0]).text().trim();
        const rate = $(columns[1]).text().trim();
        rates[currencyName] = parseFloat(rate.replace(',', '.'));
      }
    });

    if (!(fromCurrency in rates)) {
      return res.status(404).json({ error: 'Valuta non trovata' });
    }

    const exchangeRate = rates[fromCurrency];

    if (isNaN(exchangeRate)) {
      return res.status(500).json({ error: 'Tasso di cambio non valido' });
    }

    return res.json({ exchangeRate });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno server', details: err.message });
  }
});

app.listen(3001, () => {
  console.log('Proxy server in ascolto su http://localhost:3001');
});