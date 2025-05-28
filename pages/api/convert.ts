import { load } from 'cheerio';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    res.status(400).json({ error: 'Missing or invalid date' });
    return;
  }

  try {
    const url = `https://www.x-rates.com/historical/?from=EUR&amount=1&date=${date}`;
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);

    const rates: { [key: string]: number } = { Euro: 1 };
    const tableRows = $('tbody').eq(1).find('tr');
    
    tableRows.each((_, row) => {
      const columns = $(row).find('td');
      if (columns.length >= 2) {
        const currencyName = $(columns[0]).text().trim();
        const rate = $(columns[1]).text().trim();
        rates[currencyName] = parseFloat(rate.replace(',', '.'));
      }
    });

    res.status(200).json({ rates });
  } catch (error) {
    console.error('Fetch failed:', error);
    res.status(500).json({ error: 'Server error during rate fetch' });
  }
}
