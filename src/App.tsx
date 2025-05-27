import React, { useState, useRef, useEffect } from 'react';
import PdfViewer from './pdfPreview';
import ProgressApp from './SpinnerAndTime'
import AnagraficApp from './Anagrafica';
import ErrorPopup from "./show_error";
import { Tooltip } from 'react-tooltip';
import TextareaAutosize from 'react-textarea-autosize';
import useFirestoreData, {addErrorLog, logoutUtente}  from './FirestoreDataLoader';
import {AggiornaAnagrafica, DataDict} from './UpdateAnagrafica';
import ModalRecalculateC, {messageBox, fileMessages, handleRicalcola} from './RecalculateCurrency';
import {creaXmlFattura} from './CreaXml';
import 'react-tooltip/dist/react-tooltip.css';
import './styles.css';


const keysMapping : { [key :string]: string } =  {
  "IdPaese_T": "Paese trasmittente", "IdCodice_T":"Codice trasmittente", "IdPaese_P": "Paese fornitore",
  "IdCodice_P":"Codice fornitore", "Denominazione_P": "Denominazione fornitore", "Indirizzo_P": "Indirizzo fornitore",
  "CAP_P": "CAP fornitore", "Comune_P": "Comune fornitore", "Nazione_P": "Nazione fornitore",
  "IdPaese_C": "Paese cliente", "IdCodice_C":"Codice cliente", "Denominazione_C": "Denominazione cliente",
  "Indirizzo_C": "Indirizzo cliente", "CAP_C": "CAP cliente", "Comune_C": "Comune cliente",
  "Nazione_C": "Nazione cliente", "Divisa": "Valuta", "Numero_fattura": "N° fattura",
  "ImportoTotale": "Totale", "Data_pagamento": "Data pagamento", "Data_Acquisto": "Data acquisto",
  "oggetto_acquistato": "Oggetto acquistato", "ProgressivoInvio":"Progressivo Invio"
};

const App = () => {

  const { anagraficaClienti, errorLog, storicoFile } = useFirestoreData();
  const [clienti, setClienti] = useState(anagraficaClienti);
  const [errorL, setError] = useState(errorLog)
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileURLs, setFileURLs] = useState<Map<string, string>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const objectURLsRef = useRef<Map<string, string>>(new Map());
  const [formData] = useState<{ [fileName: string]: { [key: string]: string } }>({});  //, setFormData
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const [fileStatuses, setFileStatuses] = useState<Map<string, boolean | undefined>>(new Map());
  const [fileData, setFileData] = useState<Map<string, any>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const processAppRef = useRef<ProgressApp | null>(null);
  //const [dataDict, setDataDict] = useState(selectedFile ? fileData.get(selectedFile.name).data_dict : {});
  const [modal, setModal] = useState<JSX.Element | null>(null);

  // bottone Aggiorna Anagrafica
  const handleUpdateClick = (dataDict:DataDict) => {
    setModal(
      <AggiornaAnagrafica
        data_dict={dataDict}
        anagraficaClienti={clienti}
        setClienti={setClienti}
        onClose={() => setModal(null)}
        setDataDict={handleInputChange} 
      />
    );
  };

  // bottone ricalcolo valuta
  const handleRicalcolawindow = (fileName:string) =>{ 
    const data= fileData.get(fileName)
    const { data_dict, origTotalImport, origValuta } = data;

    setModal(
      <ModalRecalculateC
        onClose={() => setModal(null)}
        importoTotale= {parseFloat(origTotalImport)}
        valuta={origValuta}
        dataPagamento={data_dict.Data_pagamento}
        fileName={fileName}
        setDataDict={handleInputChange} 
      />
    );
  };

  const goToPreviousPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  const goToNextPage = () => setCurrentPage((prev) => (prev < numPages ? prev + 1 : prev));

  const tooltips: { [key: string]: string } = {
    IdPaese_T: " I primi due caratteri della Partita IVA\ndel ente che trasmette la fattura. ",
    IdPaese_P: " I primi due caratteri della Partita IVA del fornitore. ",
    IdPaese_C: " I primi due caratteri della Partita IVA del cliente. ",
    IdCodice_T: "Identificativo numerico della Partita IVA\ndel ente che trasmette la fattura.",
    IdCodice_P: "Identificativo numerico della Partita IVA del fornitore. ",
    IdCodice_C: "Identificativo numerico della Partita IVA del cliente. ",
    ProgressivoInvio: "Codice identificativo della fattura generato randomicamente."
  };

  // Funzione per processare ogni file
  const processFileAndUpdateState = async (file: File,  anagraficaClienti: any[]) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('anagrafica', JSON.stringify(anagraficaClienti));
    const fileName = file.name;

    // Chiama la funzione di processamento per ottenere i dati
    try {
      const response = await fetch('https://estrazione-dati-pdf.onrender.com', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process the file');
      }

      const data = await response.json();
      const { data_dict, errore, hasTextContent} = data
      if (data) {
        const origTotalImport = data_dict.ImportoTotale
        const origValuta = data_dict.Divisa

        // Aggiungi i dati del file a fileData
        setFileData(prev => new Map(prev).set(fileName, { data_dict, origTotalImport, origValuta }));
        
        // calcoliamo il cambio valuta
        if (data_dict.Divisa !== "EUR"){
          await handleRicalcola(
            data_dict.ImportoTotale,
            data_dict.Divisa,
            data_dict.Data_pagamento,
            fileName,
            () => {}, // Nessuna modale da chiudere
            (key, value) => {
              data_dict[key] = value;
              handleInputChange(key, value);
            }
          );
        }

        setFileStatuses(prev => {
          const updated = new Map(prev);
          updated.set(fileName, !!hasTextContent); // true se ha testo, false se è scansione
          return updated;
        });

        // Aggiungi il file alla lista dei file processati
        setFiles(prevFiles => {
          if (!prevFiles.find(f => f.name === file.name)) {
            return [...prevFiles, file];
          }
          return prevFiles;
        });


        if (errore) {
          errore.forEach((err:string)=> {
            addErrorLog("", err);
            alert(err)
          });
        }
      }

    } catch (error) {
      addErrorLog('Impossibile connettersi al web service:', error);
      setIsProcessing(false)
      alert(error);
      throw error;
    }
  };

  //rinomina il nome dei file
  const Rename = (originalName: string, index: number): string => {
    const baseName = originalName.replace(/\.[^/.]+$/, ""); // rimuove estensione
    const alphanumeric = baseName.replace(/[^a-zA-Z0-9]/g, ""); // solo lettere e numeri
    const truncated = alphanumeric.substring(0, 30); // max 30 caratteri
    return `${truncated}${index + 1}.pdf`;
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    if (selected.length === 0) return;
     
    setFiles([]);
    setFileURLs(new Map());

    setTotalFiles(selected.length);
    setIsProcessing(true);

    const renamedFiles: File[] = [];
    const newUrls = new Map<string, string>();

    selected.forEach((file, index) => {
      const newName = Rename(file.name, index);

      // Crea un nuovo File con lo stesso contenuto ma nome modificato
      const renamedFile = new File([file], newName, { type: file.type });
      renamedFiles.push(renamedFile);

      const url = URL.createObjectURL(renamedFile);
      newUrls.set(newName, url);
      setFileStatuses(prev => new Map(prev).set(newName, undefined));

      // Processa il file con il nuovo nome
      processFileAndUpdateState(renamedFile, anagraficaClienti).then(() => {
        if (processAppRef.current) {
          processAppRef.current.fileProcessed();
        }
      });
    });

    setFileURLs(newUrls);
    objectURLsRef.current = newUrls;
    setSelectedFile(null);
    setCurrentPage(1);
  };

  const handleFileClick = (file: File) => {
    setSelectedFile(file);
    setCurrentPage(1);
  };

  const closeProcessApp = () => {
    setIsProcessing(false);
  };

  //Entry
  const renderEntries = (dataDict: any, handleInputChange: (key: string, value: string) => void) => {
    return Object.keys(keysMapping).map((key) => {
      if (dataDict.hasOwnProperty(key)) {
        return (
          <div key={key} className="form-row">
            <label 
              className="form-label"
              data-tooltip-id={`tooltip-${key}`}
              data-tooltip-content={tooltips[key]}
            >
              {keysMapping[key] || key}
            </label>
            <TextareaAutosize
              ref={(el) => (textareaRefs.current[key] = el)}
              className="form-input"
              value={String(dataDict[key])}
              onChange={(e) => handleInputChange(key, e.target.value)}
              rows={1}
              autoComplete="off"
              spellCheck={false}
              autoCorrect="off"
            />
            {tooltips[key] && (
              <Tooltip id={`tooltip-${key}`} place="top"/>
            )}
          </div>
        );
      }
      return null;
    });
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const ShowLogout = () =>{
    return (
      <div className='modal-overlay'>
        <div className='modal-content OUT'>
          <button onClick={()=>setShowLogoutModal(false)} className="Xclose2">✕</button>
          <div className='label-button'>
            <label>Stai per effetuare il Logout.</label> 
            <br/>
            <label>Sei sicuro di voler uscire?</label> 
            <br/><br/>
            <button onClick={()=>logoutUtente()} className='button-style OUT'>Esci</button>
            <button onClick={()=>setShowLogoutModal(false)} className='button-style OUT'>Indietro</button>
          </div>
        </div>
      </div>
    )
  }

  const handleInputChange = (key: string, value: string) => {
    if (!selectedFile) return;
    setFileData((prevData) => {
      const updatedData = new Map(prevData);
      const fileDataCopy = { ...updatedData.get(selectedFile.name) };
      fileDataCopy.data_dict = {
        ...fileDataCopy.data_dict,
        [key]: value,
      };
      updatedData.set(selectedFile.name, fileDataCopy);
      return updatedData;
    });
  };

  //scambia cliente-fornitore
  const handleButtonClick = () => {
    if (!selectedFile) return;

    setFileData((prevData) => {
      const updatedData = new Map(prevData);
      const fileDataCopy = { ...updatedData.get(selectedFile.name) };
      const dataDict = fileDataCopy.data_dict;
      // Scambia i dati
      const newDataDict = {
        ...dataDict,
        IdPaese_C: dataDict.IdPaese_P,
        IdCodice_C: dataDict.IdCodice_P,
        Denominazione_C: dataDict.Denominazione_P,
        Indirizzo_C: dataDict.Indirizzo_P,
        CAP_C: dataDict.CAP_P,
        Comune_C: dataDict.Comune_P,
        Nazione_C: dataDict.Nazione_P,

        IdPaese_P: dataDict.IdPaese_C,
        IdCodice_P: dataDict.IdCodice_C,
        Denominazione_P: dataDict.Denominazione_C,
        Indirizzo_P: dataDict.Indirizzo_C,
        CAP_P: dataDict.CAP_C,
        Comune_P: dataDict.Comune_C,
        Nazione_P: dataDict.Nazione_C,
      };

      fileDataCopy.data_dict = newDataDict;
      updatedData.set(selectedFile.name, fileDataCopy);
      return updatedData;
    });
  };

  const [showAnagrafica, setShowAnagrafica] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const updatedRef = useRef(new Set<string>()); // flag in memoria
  useEffect(() => {
  if (
    selectedFile &&
    fileData.has(selectedFile.name) &&
    !updatedRef.current.has(selectedFile.name)
  ) {
    const dataDict = fileData.get(selectedFile.name)?.data_dict;
    if (dataDict) {
      handleUpdateClick(dataDict);
      updatedRef.current.add(selectedFile.name);
    }
  }
}, [selectedFile, fileData]);

  useEffect(() => {
    setClienti(anagraficaClienti);
  }, [anagraficaClienti]);

  useEffect(() => {
    setError(errorLog);
  }, [errorLog]);

  useEffect(() => {
    Object.values(textareaRefs.current).forEach((textarea) => {
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
      }
    });
  }, [formData]);

  return (
    <div className="app-container">
      <aside className="side-panel">
        <label htmlFor="file-upload" className="file-upload-button button-style" title="Carica uno o più file PDF">
          Carica PDF ⏫
        </label>
        <input
          id="file-upload"
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div className="list-container">
          <div className="listcont">
            <ul className="interactive-list">
              {files.map((file, index) => {
                return (
                  <li
                    key={index}
                    onClick={() => handleFileClick(file)}
                    className={selectedFile?.name === file.name ? 'selected' : ''}
                  >
                    <span className="nome-file">{file.name}</span>
                    {fileStatuses.get(file.name) === false && (
                      <span className="no-text-warning" title="PDF generato tramite scansione">⚠️</span>
                    )}
                    {/*aggiungere funzione per riconoscere nome o testo*/}
                    {storicoFile}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <button
          onClick={() => {
            // Itera attraverso la lista dei file
            files.forEach((file) => {
              const data = fileData.get(file.name)?.data_dict;

              // Controllo per verificare che i dati siano presenti per ogni file
              if (data) {
                creaXmlFattura(data, file.name, ""); // Salva il file XML per ogni elemento della lista
              } else {
                alert(`Dati mancanti per il file: ${file.name}`);
              }
            });
          }}
          className="button-style"
        >
          Scarica tutti XML ⏬
        </button>
      </aside>

      <main className="main-content">
        {isProcessing ? (
          <div className="modal1-overlay">
            <div className="progress-modal">
              <ProgressApp
                totalFiles={totalFiles}
                gifPath="./Spinner@1x-1.0s-200px-200px.gif"
                onClose={closeProcessApp}
                ref={processAppRef}
              />
            </div>
          </div>
          ) :
          selectedFile ? (
            <>
              <div className="pdf-frame">
                {fileURLs.has(selectedFile.name) && (
                  <PdfViewer
                    file={fileURLs.get(selectedFile.name)!}
                    currentPage={currentPage}
                    setNumPages={setNumPages}
                  />
                )}
              </div>

              <div className="button-container1">
                <div className="butt-Prev">
                  <button
                    className="button-style"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    Precedente
                  </button>
                </div>
                <div className="page-indicator">
                  Pagina {currentPage} di {numPages}
                </div>
                <div className="butt-Next">
                  <button
                    className="button-style"
                    onClick={goToNextPage}
                    disabled={currentPage === numPages}
                  >
                    Successiva
                  </button>
                </div>
              </div>

              <div className="entry-frame">
                <div className="entry-container">
                  {fileData.has(selectedFile.name) && renderEntries(fileData.get(selectedFile.name)?.data_dict || {}, handleInputChange)}
                </div>

                <div className="bottom-entry">
                  <div className="b1">
                    <button className="button-style" onClick={() => handleUpdateClick(fileData.get(selectedFile.name).data_dict)} >Aggiorna Anagrafica</button>
                    {modal}
                  </div>
                  <div className="b2">
                    <button className="button-style" onClick={handleButtonClick}>Cliente ⮀ Fornitore</button>
                  </div>
                  <div className="b3">
                    <button className="button-style" onClick={() => handleRicalcolawindow(selectedFile.name)}>Ricalcola cambio valuta</button>
                  </div>
                </div>
              </div>

              <div className="button-container2">
                <div className="butt-xml">
                  <button
                    onClick={() => {
                      const data = fileData.get(selectedFile.name).data_dict;

                      // Controllo per verificare che i dati siano presenti
                      if (data) {
                        creaXmlFattura(data, selectedFile.name, "");
                      } else {
                        alert("Dati non trovati per il file selezionato.");
                      }
                    }}
                    className="button-style"
                  >
                    Scarica XML
                  </button>
                </div>
              </div>
            </>
        ): null }
      </main>


      <div className="extra-panel">
        <div>
          {showLogoutModal && <ShowLogout />}
          <button onClick={() => setShowLogoutModal(true)}className='button-style logout'>Logout</button>
          <button onClick={() => setShowAnagrafica(true)} className="button-style">
            Anagrafica 📋
          </button>

          {showAnagrafica && (
            <AnagraficApp
              anagraficaClienti={clienti}
              updateAnagraficaClienti={(updatedClienti) => setClienti(updatedClienti)}
              onClose={() => setShowAnagrafica(false)}
            />
          )}
        </div>
        <div className="extra-label">
          <div className='message-box'>
            {selectedFile?.name && fileMessages[selectedFile.name]
              ? messageBox(selectedFile.name)
              : null
            }
          </div>
        </div>
        <button onClick={() => { setShowPopup(true)}} className="button-style">
        Log degli errori ⚠️
      </button>
      <ErrorPopup isOpen={showPopup} onClose={() => setShowPopup(false)} errorLog={errorL} />
      </div>
    </div>
  );
};

export default App;