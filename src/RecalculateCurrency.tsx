import React,{useState} from 'react';
import { load }  from 'cheerio';
import type { Element } from 'domhandler';
import {addErrorLog} from './FirestoreDataLoader';

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

async function convertToEuro(
  amount: number,
  divisa: string,
  date: string,
  fileName: string,
): Promise<number> {
  const fromCurrency = currency_mapping[divisa];

  if (!fromCurrency) {
    alert(`Valuta ${divisa} non valida o non supportata. Controlla e riprova.`);
    return amount 
  }

  if (divisa === "EUR") {
    return amount
  }

  try {
    const url = `https://www.x-rates.com/historical/?from=EUR&amount=1&date=${date}`;
    const response = await fetch(url);
    
    const html = await response.text();
    const $ = load(html);
    
    const rates: { [key: string]: number } = { Euro: 1 };
    
    // la tabella con i tassi è la seconda tbody
    const tableRows = $('tbody').eq(1).find('tr');
    tableRows.each((_: unknown, row: Element) => {
    const columns = $(row).find('td');
      if (columns.length >= 2) {
        const currencyName = $(columns[0]).text().trim();
        const rate = $(columns[1]).text().trim();
        rates[currencyName] = parseFloat(rate.replace(',', '.'));
      }
    });

    if (!rates[fromCurrency]) {
      throw new Error(`Tasso di cambio per ${fromCurrency} non trovato.`);
    }

    let exchangeRate = 1 / rates[fromCurrency];
    let result = amount * exchangeRate;
    result = Math.floor(result * 100) / 100;

    fileMessages[fileName] = [
      `Tasso di cambio in data`,
      ` ${date}: `,
      ` 1 ${divisa} = ${exchangeRate.toFixed(4)} EUR `
    ];

    return result;
  } catch (error) {
    addErrorLog("Errore durante la conversione:", error);
    alert(error);
    throw error;
  }
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
