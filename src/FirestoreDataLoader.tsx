import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";

// Configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCXJG7BsJ5eN05SV80RqVeSLuoiwXtxHiE",
  authDomain: "convertitore-pdf-xml.firebaseapp.com",
  projectId: "convertitore-pdf-xml",
  storageBucket: "convertitore-pdf-xml.appspot.com",
  messagingSenderId: "1020310586209",
  appId: "1:1020310586209:web:8c0a48a5d488bb5c73fb20",
  measurementId: "G-HQJW2PHZTF"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();


//mappa errori
const getFriendlyFirebaseError = (errorCode: string): string => {
  const errors: { [key: string]: string } = {
    "auth/invalid-email": "L'indirizzo email non è valido.",
    "auth/user-disabled": "Questo account è stato disabilitato.",
    "auth/user-not-found": "Utente non trovato. Controlla l'email inserita.",
    "auth/wrong-password": "Password errata. Riprova.",
    "auth/email-already-in-use": "L'email è già in uso da un altro account.",
    "auth/weak-password": "La password è troppo debole. Usa almeno 6 caratteri.",
    "auth/too-many-requests": "Troppi tentativi. Attendi e riprova più tardi.",
    "auth/network-request-failed": "Errore di rete. Verifica la connessione.",
  };

  return errors[errorCode] ||"Controlla le credenziali e riprova!";
};

// Funzione per pulire i log vecchi
const cleanOldLogs = async (uid: string) => {
  const docRef = doc(db, "utenti", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const now = new Date().getTime();
    const filteredLogs = (data.error_log || []).filter((log: string) => {
      const dateLine = log.split("\n")[1];
      const logDate = new Date(dateLine).getTime();
      return now - logDate < 24 * 60 * 60 * 1000; // 24 ore in ms
    });

    await updateDoc(docRef, { error_log: filteredLogs });
  }
};

// Funzioni CRUD
export const addCliente = async (cliente: any) => {
  const user = auth.currentUser;
  if (!user) return;
  const docRef = doc(db, "utenti", user.uid);
  await updateDoc(docRef, {
    anagrafica_clienti: arrayUnion(cliente)
  });
};

export const updateCliente = async (cliente: any) => {
  const user = auth.currentUser;
  if (!user) return;
  const docRef = doc(db, "utenti", user.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const updatedClienti = data.anagrafica_clienti.map((c: any) =>
      c.partita_iva === cliente.partita_iva ? cliente : c
    );
    await updateDoc(docRef, { anagrafica_clienti: updatedClienti });
  }
};

export const deleteCliente = async (cliente: any) => {
  const user = auth.currentUser;
  if (!user) return;
  const docRef = doc(db, "utenti", user.uid);
  await updateDoc(docRef, {
    anagrafica_clienti: arrayRemove(cliente)
  });
};

//log errori
export const addErrorLog = async (errorName: string, errorMessage: string | unknown) => {
  const user = auth.currentUser;
  if (!user) return;
  const docRef = doc(db, "utenti", user.uid);
  const date = new Date().toISOString();
  const errorString = `-----------------------\n${date}\n${errorName}\n${errorMessage}`;
  await updateDoc(docRef, { error_log: arrayUnion(errorString) });
};

// login & logout
export async function loginUtente(email: string, password: string): Promise<boolean> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login effettuato!");
    return true;
  } catch (error: any) {
    const errorMessage = getFriendlyFirebaseError(error.code);
    alert(`Errore nel login: ${errorMessage}`);
    return false;
  }
}

export async function logoutUtente() {
  try {
    await signOut(auth);
    alert("Logout effettuato");
  } catch (error: any) {
    const msg = getFriendlyFirebaseError(error.code || "generic");
    alert(`Errore nel logout: ${msg}`);
  }
}


// Registrazione utente
export async function registraUtente(email: string, password: string): Promise<boolean>  {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "utenti", user.uid), {
      anagrafica_clienti: [],
      error_log: [],
      storico_file: []
    });
    console.log("Utente registrato!");
    return true;

  } catch (error: any) {
    const errorMessage = getFriendlyFirebaseError(error.code);
    alert(`Errore durante la registrazione: ${errorMessage}`);
    return false;
  }
}

//registra utente che fa login con google
export const CreaDocUt = async (uid: string) => {
  const docRef = doc(db, "utenti", uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      anagrafica_clienti: [],
      error_log: [],
      storico_file: []
    });
  }
};


// Hook per i dati utente autenticato
const useFirestoreData = () => {
  const [anagraficaClienti, setAnagraficaClienti] = useState<any[]>([]);
  const [errorLog, setErrorLog] = useState<any[]>([]);
  const [storicoFile, setStoricoFile] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        setUserId(uid);

        const docRef = doc(db, "utenti", uid);
        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAnagraficaClienti(data.anagrafica_clienti || []);
            setErrorLog(data.error_log || []);
            setStoricoFile(data.storico_file || []);
            cleanOldLogs(uid); // pulizia log vecchi
          }
        });

        return () => unsubscribeSnapshot();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return { anagraficaClienti, errorLog, storicoFile, userId };
};

export default useFirestoreData;