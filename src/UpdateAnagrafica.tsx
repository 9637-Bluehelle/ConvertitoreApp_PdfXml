import React, { useEffect, useState } from 'react';
import { addCliente } from "./FirestoreDataLoader";
import TextareaAutosize from 'react-textarea-autosize';

export interface Cliente {
  Denominazione: string;
  partita_iva: string;
  indirizzo: string;
  cap: string;
  comune: string;
  nazione: string;
}

export interface DataDict {
  IdPaese_C: string;
  IdCodice_C: string;
  Denominazione_C: string;
  Indirizzo_C: string;
  CAP_C: string;
  Comune_C: string;
  Nazione_C: string;
}

const fieldLabels: { [key in keyof Cliente]: string } = {
  Denominazione: "Denominazione",
  partita_iva: "Partita IVA",
  indirizzo: "Indirizzo",
  cap: "CAP",
  comune: "Comune",
  nazione: "Nazione",
};

const normalize = (str: string): string =>
  str.toLowerCase().replace(/[^a-z0-9]/g, '');

const trovaClienteEsistente = (
  clienti: Cliente[],
  denominazione: string,
  partitaIVA: string
): Cliente | undefined => {
  return clienti.find(
    (cliente) =>
      normalize(cliente.partita_iva) === normalize(partitaIVA) ||
      normalize(cliente.Denominazione) === normalize(denominazione)
  );
};


const ClienteADataDict = (
  cliente: Cliente,
  setDataDict: (key: string, value: string) => void
) => {
  setDataDict("IdPaese_C", cliente.partita_iva.slice(0, 2));
  setDataDict("IdCodice_C", cliente.partita_iva.slice(2));
  setDataDict("Denominazione_C", cliente.Denominazione);
  setDataDict("Indirizzo_C", cliente.indirizzo);
  setDataDict("CAP_C", cliente.cap);
  setDataDict("Comune_C", cliente.comune);
  setDataDict("Nazione_C", cliente.nazione);
};


export const AggiornaAnagrafica: React.FC<{
  data_dict: DataDict;
  anagraficaClienti: Cliente[];
  setClienti: React.Dispatch<React.SetStateAction<Cliente[]>>;
  onClose: () => void;
  setDataDict: (key: string, value: string) => void;
}> = ({ data_dict, anagraficaClienti, onClose, setDataDict }) => {

  const partitaIVA = data_dict.IdPaese_C + data_dict.IdCodice_C;

  const clienteEsistente = trovaClienteEsistente(
    anagraficaClienti,
    data_dict.Denominazione_C,
    partitaIVA
  );

  useEffect(() => {
    if (clienteEsistente) {
      ClienteADataDict(clienteEsistente, setDataDict);
      onClose();
    }
  }, [clienteEsistente, onClose, setDataDict]);

  const [clienteData, setClienteData] = useState<Cliente>(() => ({
    Denominazione: data_dict.Denominazione_C,
    partita_iva: partitaIVA,
    indirizzo: data_dict.Indirizzo_C,
    cap: data_dict.CAP_C,
    comune: data_dict.Comune_C,
    nazione: data_dict.Nazione_C,
  }));

  const handleChangeCliente = (key: keyof Cliente, value: string) => {
    setClienteData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleConferma = async () => {
    await addCliente(clienteData);
    ClienteADataDict(clienteData, setDataDict)
    onClose();
  };

  const renderEntries = () =>
    Object.keys(clienteData).map((key) => (
      <div key={key} className="form-row">
        <label className="form-label">{fieldLabels[key as keyof Cliente]}</label>
        <TextareaAutosize
          className="form-input"
          value={clienteData[key as keyof Cliente] || ""}
          onChange={(e) => handleChangeCliente(key as keyof Cliente, e.target.value)}
          rows={1}
        />
      </div>
    ));

  if (clienteEsistente) return null; //evita che appaia la modale!

  return (
    <div className="overlayer3">
      <div className="content3">
        <button className="X2close" onClick={onClose}>✕</button>
        <h2 className="text-title">Nuovi dati rilevati.</h2>
        <h2 className="text-Stitle">Vuoi creare una nuova anagrafica?</h2>
        <div className="entryUpdateA">{renderEntries()}</div>
        <div className="Butt-f">
          <div className="butt-f1">
            <button className="button-style" onClick={handleConferma}>Conferma</button>
          </div>
          <div className="butt-f1">
            <button className="button-style" onClick={onClose}>Annulla</button>
          </div>
        </div>
      </div>
    </div>
  );
};                     