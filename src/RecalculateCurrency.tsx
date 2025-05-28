import React,{useState} from 'react';
//import { load }  from 'cheerio';
//import type { Element } from 'domhandler';
//import {addErrorLog} from './FirestoreDataLoader';

const currency_mapping: { [key: string]: string } = {
        "EUR": "Euro","USD": "US Dollar","ARS": "Argentine Peso","AUD": "Australian Dollar","BHD": "Bahraini Dinar","BWP": "Botswana Pula",
        "BRL": "Brazilian Real","GBP": "British Pound","BND": "Bruneian Dollar","BGN": "Bulgarian Lev",
        "CAD": "Canadian Dollar","CLP": "Chilean Peso","CNY": "Chinese Yuan Renminbi","COP": "Colombian Peso",
        "CZK": "Czech Koruna","DKK": "Danish Krone","AED": "Emirati Dirham","HKD": "Hong Kong Dollar","HUF": "Hungarian Forint",
        "ISK": "Icelandic Krona","INR": "Indian Rupee","IDR": "Indonesian Rupiah","IRR": "Iranian Rial","ILS": "Israeli Shekel",
        "JPY": "Japanese Yen","KZT": "Kazakhstani Tenge","KWD": "Kuwaiti Dinar","LYD": "Libyan Dinar","MYR": "Malaysian Ringgit",
        "MUR": "Mauritian Rupee","MXN": "Mexican Peso","NPR": "Nepalese Rupee","NZD": "New Zealand Dollar","NOK": "Norwegian Krone",
        "OMR": "Omani Rial","PKR": "Pakistani Rupee","PHP": "Philippine Peso","PLN": "Polish Zloty","QAR": "Qatari Riyal",
        "RON": "Romanian New Leu","RUB": "Russian Ruble","SAR": "Saudi Arabian Riyal","SGD": "Singapore Dollar","ZAR": "South African Rand",
        "KRW": "South Korean Won","LKR": "Sri Lankan Rupee","SEK": "Swedish Krona","CHF": "Swiss Franc","TWD": "Taiwan New Dollar",
        "THB": "Thai Baht","TTD": "Trinidadian Dollar","TRY": "Turkish Lira"
    }

export const fileMessages: { [key: string]: string[] } = {}

async function fetchRatesForDate(date: string) {
  const url = `https://tassidicambio.bancaditalia.it/terzevalute-wf-web/rest/v1.0/dailyRates?referenceDate=${date}&currencyIsoCode=EUR&lang=it`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Errore fetch Banca d'Italia: ${response.status}`);
  const text = await response.text();
  return text;
}

function parseRatesCSV(csvText: string): { [key: string]: number } {
  const lines = csvText.trim().split('\n');
  // La prima linea è header
  const rates: { [key: string]: number } = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Divido su virgola (attenzione a valori testuali con virgole? Qui sembra no)
    const cols = line.split(',');
    // Indici basati su esempio: Codice ISO = colonna 2, Quotazione = colonna 4
    const codiceISO = cols[2];
    const quotazioneStr = cols[4];
    const quotazione = parseFloat(quotazioneStr);
    if (!isNaN(quotazione)) {
      rates[codiceISO] = quotazione;
    }
  }
  return rates;
}

async function convertToEuro(
  amount: number,
  divisa: string,
  date: string,
  fileName: string,
): Promise<number> {
  const fromCurrency = divisa;

  if (!currency_mapping[fromCurrency]) {
    alert(`Valuta ${fromCurrency} non valida o non supportata. Controlla e riprova.`);
    return amount;
  }

  if (fromCurrency === "EUR") {
    return amount;
  }

  let currentDate = date;
  let csvText: string | null = null;
  let rates: { [key: string]: number } | null = null;

  for (let i = 0; i < 7; i++) { // max 7 giorni indietro
    try {
      csvText = await fetchRatesForDate(currentDate);
      rates = parseRatesCSV(csvText);

      if (rates && rates[fromCurrency]) {
        break; // trovato il tasso per questa data (o precedente)
      } else {
        throw new Error(`Tasso di cambio per ${fromCurrency} non trovato per la data ${currentDate}`);
      }
    } catch (err) {
      const dt = new Date(currentDate);
      dt.setDate(dt.getDate() - 1);
      currentDate = dt.toISOString().slice(0, 10);
      if (i === 6) {
        alert(`Impossibile recuperare il tasso di cambio per ${fromCurrency} nelle ultime 7 giornate.`);
        throw err;
      }
    }
  }

  if (!rates || !rates[fromCurrency]) {
    alert(`Tasso di cambio per ${fromCurrency} non trovato.`);
    return amount;
  }

  const exchangeRate = 1 / rates[fromCurrency];
  let result = amount * exchangeRate;
  result = Math.floor(result * 100) / 100;

  if (currentDate !== date) {
    fileMessages[fileName] = [
      `Tasso di cambio non disponibile per la data ${date} `,
      `(weekend o festivo),  è stata utilizzata la data precedente ${currentDate}. `,
      `1 ${divisa} = ${exchangeRate.toFixed(4)} EUR`,
    ];
  } else {
    fileMessages[fileName] = [
      `Tasso di cambio in data`,
      ` ${date}: `,
      ` 1 ${divisa} = ${exchangeRate.toFixed(4)} EUR `,
    ];
  }

  return result;
}


interface ModalProps {
  onClose: () => void;
  importoTotale: number;
  valuta: string;
  dataPagamento: string;
  fileName: string;
  setDataDict: (key: string, value: string) => void; 
}

export async function handleRicalcola(
  importoState: string,
  valutaState: string,
  dataState: string,
  fileName: string,
  onClose: () => void,
  setDataDict: (key: string, value: string) => void
): Promise<void> {
  try {
    const result = await convertToEuro(
      parseFloat(importoState),
      valutaState,
      dataState,
      fileName,
    );
    setDataDict("ImportoTotale", result.toString());
    setDataDict("Divisa", "EUR");
    setDataDict("Data_pagamento", dataState);
    onClose();
  } catch (err) {
    console.error("Errore nella conversione:", err);
  }
}

const ModalRecalculateC: React.FC<ModalProps> = ({
  onClose,
  importoTotale,
  valuta,
  dataPagamento,
  fileName, 
  setDataDict,
}) => {
  const [valutaState, setValutaState] = useState(valuta);
  const [importoState, setImportoState] = useState(importoTotale.toString());
  const [dataState, setDataState] = useState(dataPagamento);

  return (
    <div className="overlayer3">
      <div className="content4">
        <button className="X2close" onClick={onClose}>✕</button>
        <div className="modal-title">
          <h2 className="lab1">Cambio valuta in Euro.</h2>
          <span className="info-icon2" title="Qui sono riportati i dati originali estratti dalla fattura.">🛈</span>
        </div>
        <div id="entry" className="entry">
          <div className="entry-row">
            <label className='left-entrykeys'>Valuta</label>
            <textarea 
            className="form-input" 
            value={valutaState} 
            rows={1} 
            autoComplete="off"
            spellCheck={false} 
            autoCorrect="off"
            onChange={(e) => setValutaState(e.target.value)} />
          </div>
          <div className="entry-row">
            <label className='left-entrykeys'>Importo Totale</label>
            <textarea 
            className="form-input" 
            value={importoState} 
            rows={1} 
            autoComplete="off" 
            spellCheck={false}
            autoCorrect="off"
            onChange={(e) => setImportoState(e.target.value)} />
          </div>
          <div className="entry-row"> 
            <label className='left-entrykeys'>Data Pagamento</label>
            <textarea 
            className="form-input" 
            value={dataState} 
            rows={1} 
            autoComplete="off"
            spellCheck={false}
            autoCorrect="off"
            onChange={(e) => setDataState(e.target.value)} />
          </div>
        </div>
        <div className='button-ricalcola'>
          <button className="button-style" onClick={() => handleRicalcola(importoState, valutaState, dataState, fileName, onClose, setDataDict)}>Ricalcola</button>
        </div>
      </div>
    </div>
  );
};

export default ModalRecalculateC;


export function messageBox(fileName:string){ 
  const messages = fileMessages[fileName] || ["", "", ""];
  const [label1, label2, label3] = messages;

  return (
    <div className='label'>
      <div className='label1-box'>{label1}</div>
      <div className='label2-box'>{label2}</div>
      <div className='label3-box'>{label3}</div>
    </div>
  );
}
