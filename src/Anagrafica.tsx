import React, { useState } from "react";
import { addCliente, updateCliente, deleteCliente } from "./FirestoreDataLoader";

// Tipo Cliente
type Cliente = {
  Denominazione: string;
  partita_iva: string;
  indirizzo: string;
  cap: string;
  comune: string;
  nazione: string;
};

// Componente ClienteForm
const ClienteForm: React.FC<{
  onChange: (form: Cliente) => void;
  initial?: Cliente;
}> = ({ onChange, initial }) => {
  const [form, setForm] = useState<Cliente>(
    initial || {
      Denominazione: "",
      partita_iva: "",
      indirizzo: "",
      cap: "",
      comune: "",
      nazione: "",
    }
  );

  const fieldLabels: { [key in keyof Cliente]: string } = {
  Denominazione: "Denominazione",
  partita_iva: "Partita IVA",
  indirizzo: "Indirizzo",
  cap: "CAP",
  comune: "Comune",
  nazione: "Nazione",
};

// Array che definisce l'ordine dei campi
  const fieldOrder = [
    "Denominazione",
    "partita_iva",
    "indirizzo",
    "cap",
    "comune",
    "nazione",
  ];


  React.useEffect(() => {
    if (initial) {
      setForm(initial);
    }
  }, [initial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    onChange(updatedForm);
  };
                                                     
  return (
    <div className="form-container">
        {fieldOrder.map((key) => (
        <div className="form-row" key={key}>
          <label className="form-label">{fieldLabels[key as keyof Cliente]}</label>
          <input
            name={key}
            value={form[key as keyof Cliente]}
            onChange={handleChange}
            className="form-input"
          />
        </div>
      ))}
    </div>
  );
};

// Componente principale AnagraficApp
const AnagraficApp: React.FC<{
  onClose: () => void;
  anagraficaClienti: Cliente[];
  updateAnagraficaClienti: (data:Cliente[]) => void;
}> = ({ onClose, anagraficaClienti, updateAnagraficaClienti }) => {
  const [view, setView] = useState<"none" | "menu" | "aggiungi" | "modifica" | "elimina">("none");
  const [selected, setSelected] = useState<string>("");
  const [clienteModificato, setClienteModificato] = useState<Cliente | null>(null);

  const salvaClienti = (data: Cliente[]) => {
    updateAnagraficaClienti(data);
  };

  const clienteSelezionato = anagraficaClienti.find((c) => c.Denominazione === selected);

  const tuttiCampiCompilati = (cliente: Cliente | null) => {
    if (!cliente) return false;
    return Object.values(cliente).every((val) => val.trim() !== "");
  };

  const handleAddCliente = async () => {
    if (clienteModificato) {
      await addCliente(clienteModificato);
      salvaClienti([...anagraficaClienti, clienteModificato]);
      setClienteModificato(null);
      setView("none");
    }
  };

  const handleUpdateCliente = async () => {
    if (clienteModificato) {
      await updateCliente(clienteModificato);
      const updated = anagraficaClienti.map((c) => (c.partita_iva === clienteModificato.partita_iva ? clienteModificato : c));
      salvaClienti(updated);
      setView("none");
      setSelected("");
      setClienteModificato(null);
    }
  };

  const handleDeleteCliente = async () => {
    const clienteToDelete = anagraficaClienti.find((c) => c.Denominazione === selected);
    if (clienteToDelete) {
      await deleteCliente(clienteToDelete);
      const updated = anagraficaClienti.filter((c) => c.Denominazione !== selected);
      salvaClienti(updated);
      setSelected("");
      setView("none");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="titlefont">
            {{
              none: "Gestione Clienti",
              menu: "Gestione Clienti",
              aggiungi: "Aggiungi Cliente",
              modifica: "Modifica Cliente",
              elimina: "Elimina Cliente",
            }[view]}
          </h2>
          <button onClick={onClose} className="Xclose">✕</button>
        </div>

        {view === "none" && (
          <div className="contentmenu">
            <button onClick={() => setView("aggiungi")} className="button-style">Aggiungi Cliente</button>
            <button onClick={() => setView("modifica")} className="button-style">Modifica Cliente</button>
            <button onClick={() => setView("elimina")} className="button-style">Elimina Cliente</button>
          </div>
        )}

        {view === "aggiungi" && (
          <div className="form-wrapper">
            <ClienteForm onChange={(form) => setClienteModificato(form)} />
            <div className="button-menu">
              <button
                onClick={handleAddCliente}
                className="button-style"
                disabled={!tuttiCampiCompilati(clienteModificato)}
              >
                Conferma
              </button>
              <button onClick={() => setView("none")} className="button-style">Indietro</button>
            </div>
          </div>
        )}

        {view === "modifica" && (
          <div className="form-wrapper">
            <select className="input mb-4" value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Seleziona cliente</option>
              {anagraficaClienti.map((c) => (
                <option key={c.partita_iva} value={c.Denominazione}>
                  {c.Denominazione}
                </option>
              ))}
            </select>

            {clienteSelezionato && (
              <ClienteForm initial={clienteSelezionato} onChange={(form) => setClienteModificato(form)} />
            )}

            <div className="button-menu">
              <button
                onClick={handleUpdateCliente}
                className="button-style"
                disabled={!tuttiCampiCompilati(clienteModificato)}
              >
                Conferma
              </button>
              <button onClick={() => setView("none")} className="button-style">Indietro</button>
            </div>
          </div>
        )}

        {view === "elimina" && (
          <div className="form-wrapper">
            <select className="input mb-4" value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Seleziona cliente da eliminare</option>
              {anagraficaClienti.map((c) => (
                <option key={c.partita_iva} value={c.Denominazione}>
                  {c.Denominazione}
                </option>
              ))}
            </select>

            <div className="button-menu">
              <button
                onClick={handleDeleteCliente}
                className="button-style"
                disabled={!selected}
              >
                Elimina
              </button>
              <button onClick={() => setView("none")} className="button-style">Indietro</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnagraficApp;