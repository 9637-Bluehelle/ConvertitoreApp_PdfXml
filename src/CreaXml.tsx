import { saveAs } from "file-saver";
import {addErrorLog} from './FirestoreDataLoader';

interface DataPdf {
  IdPaese_T: string;
  IdCodice_T: string;
  IdPaese_P: string;
  IdCodice_P: string;
  Denominazione_P: string;
  Indirizzo_P: string;
  CAP_P: string;
  Comune_P: string;
  Nazione_P: string;
  IdPaese_C: string;
  IdCodice_C: string;
  Denominazione_C: string;
  Indirizzo_C: string;
  CAP_C: string;
  Comune_C: string;
  Nazione_C: string;
  Numero_fattura: string;
  Divisa: string;
  ImportoTotale: string;
  Data_Acquisto: string;
  Data_pagamento: string;
  oggetto_acquistato: string;
  ProgressivoInvio: string;
}

export const creaXmlFattura = (dataPdf: DataPdf, nameFile: string, folder: string) => {
  try{
    const emptyKeys = Object.keys(dataPdf).filter((key) => (dataPdf as any)[key] === "");

    if (emptyKeys.length) {
      alert(`Alcuni dati nel file ${nameFile} sono mancanti!\nControlla e riprova il salvataggio.`);
      return;
    }

      const xmlDocument = `<?xml version="1.0" encoding="UTF-8"?>
  <ns2:FatturaElettronica 
  xmlns:ns2="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" 
  versione="FPR12">
    <FatturaElettronicaHeader>
      <DatiTrasmissione>
        <IdTrasmittente>
          <IdPaese>${dataPdf.IdPaese_T}</IdPaese>
          <IdCodice>${dataPdf.IdCodice_T}</IdCodice>
        </IdTrasmittente>
        <ProgressivoInvio>${dataPdf.ProgressivoInvio}</ProgressivoInvio>
        <FormatoTrasmissione>FPR12</FormatoTrasmissione>
        <CodiceDestinatario>0000000</CodiceDestinatario>
      </DatiTrasmissione>
      <CedentePrestatore>
        <DatiAnagrafici>
          <IdFiscaleIVA>
            <IdPaese>${dataPdf.IdPaese_P}</IdPaese>
            <IdCodice>${dataPdf.IdCodice_P}</IdCodice>
          </IdFiscaleIVA>
          <Anagrafica>
            <Denominazione>${dataPdf.Denominazione_P}</Denominazione>
          </Anagrafica>
          <RegimeFiscale>RF01</RegimeFiscale>
        </DatiAnagrafici>
        <Sede>
          <Indirizzo>${dataPdf.Indirizzo_P}</Indirizzo>
          <CAP>${dataPdf.CAP_P}</CAP>
          <Comune>${dataPdf.Comune_P}</Comune>
          <Nazione>${dataPdf.Nazione_P}</Nazione>
        </Sede>
        <RiferimentoAmministrazione>P.IVA: ${dataPdf.IdCodice_P}</RiferimentoAmministrazione>
      </CedentePrestatore>
      <CessionarioCommittente>
        <DatiAnagrafici>
          <IdFiscaleIVA>
            <IdPaese>${dataPdf.IdPaese_C}</IdPaese>
            <IdCodice>${dataPdf.IdCodice_C}</IdCodice>
          </IdFiscaleIVA>
          <Anagrafica>
            <Denominazione>${dataPdf.Denominazione_C}</Denominazione>
          </Anagrafica>
        </DatiAnagrafici>
        <Sede>
          <Indirizzo>${dataPdf.Indirizzo_C}</Indirizzo>
          <CAP>${dataPdf.CAP_C}</CAP>
          <Comune>${dataPdf.Comune_C}</Comune>
          <Nazione>${dataPdf.Nazione_C}</Nazione>
        </Sede>
      </CessionarioCommittente>
    </FatturaElettronicaHeader>
    <FatturaElettronicaBody>
      <DatiGenerali>
        <DatiGeneraliDocumento>
          <TipoDocumento>TD01</TipoDocumento>
          <Divisa>${dataPdf.Divisa}</Divisa>
          <Data>${dataPdf.Data_Acquisto}</Data>
          <Numero>${dataPdf.Numero_fattura}</Numero>
          <ImportoTotaleDocumento>${dataPdf.ImportoTotale}</ImportoTotaleDocumento>
          <Arrotondamento>0.00</Arrotondamento>
       </DatiGeneraliDocumento>
      </DatiGenerali>
      <DatiBeniServizi>
        <DettaglioLinee>
          <NumeroLinea>1</NumeroLinea>
          <Descrizione>${dataPdf.oggetto_acquistato}</Descrizione>
          <Quantita>1.00</Quantita>
          <DataInizioPeriodo>${dataPdf.Data_Acquisto}</DataInizioPeriodo>
          <DataFinePeriodo>${dataPdf.Data_pagamento}</DataFinePeriodo>
          <PrezzoUnitario>${dataPdf.ImportoTotale}</PrezzoUnitario>
          <PrezzoTotale>${dataPdf.ImportoTotale}</PrezzoTotale>
          <AliquotaIVA>0.00</AliquotaIVA>
          <Natura>N2.2</Natura>
        </DettaglioLinee>
        <DatiRiepilogo>
          <AliquotaIVA>0.00</AliquotaIVA>
          <Natura>N2.2</Natura>
          <Arrotondamento>0.00</Arrotondamento>
          <ImponibileImporto>${dataPdf.ImportoTotale}</ImponibileImporto>
          <Imposta>0.00</Imposta>
        </DatiRiepilogo>
      </DatiBeniServizi>
      <DatiPagamento>
        <CondizioniPagamento>TP02</CondizioniPagamento>
        <DettaglioPagamento>
          <ModalitaPagamento>MP08</ModalitaPagamento>
          <ImportoPagamento>${dataPdf.ImportoTotale}</ImportoPagamento>
        </DettaglioPagamento>
      </DatiPagamento>
    </FatturaElettronicaBody>
  </ns2:FatturaElettronica>`;

      const blob = new Blob([xmlDocument], { type: "application/xml" });
      saveAs(blob, `${folder}/${nameFile}.xml`);
      
  } catch (error) {
    addErrorLog("Errore durante il salvataggio del file XML:", error);
    alert("Si è verificato un errore durante il salvataggio del file XML.");
  }
};