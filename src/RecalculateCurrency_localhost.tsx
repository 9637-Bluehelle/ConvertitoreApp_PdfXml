import React,{useState} from 'react';
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

  try {
    // Chiamata al backend proxy (localhost:3001)
    const response = await fetch(
      `http://localhost:3001/api/exchange-rate?fromCurrency=${encodeURIComponent(fromCurrency)}&date=${encodeURIComponent(date)}`
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    let exchangeRate = data.exchangeRate;

    // Se la valuta non è Euro, inverti il tasso
    if (fromCurrency !== "Euro") {
      exchangeRate = 1 / exchangeRate;
    }

    let result = amount * exchangeRate;
    result = Math.floor(result * 100) / 100;

    const message1 = ` Tasso di cambio in data `;
    const message2 = ` ${date}: ` ;
    const message3 = ` 1 ${divisa} = ${exchangeRate.toFixed(4)} EUR `;

    fileMessages[fileName] = [message1, message2, message3];

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
  const [label1, label2, label3] = fileMessages[fileName]
  return (
    <div className='label'>
      <div className='label1-box'>{label1}</div>
      <div className='label2-box'>{label2}</div>
      <div className='label3-box'>{label3}</div>
    </div>
  );
}