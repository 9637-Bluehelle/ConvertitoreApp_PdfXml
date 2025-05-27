import React from "react";

interface ErrorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  errorLog: string[];
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ isOpen, onClose, errorLog }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button onClick={onClose} className="Xbutt">✕</button>
        <div className="modal-titolo">
          <h2>
            Errori del programma{" "}
            <span className="info-icon" title="I log vengono cancellati dopo 24 ore.">🛈</span>
          </h2>
        </div>
        <div className="modal-text">
          <ul>
            {errorLog.length === 0 ? (
              <li>Nessun errore trovato.</li>
            ) : (
              errorLog.map((error, index) => <li key={index}>{error}</li>)
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorPopup;