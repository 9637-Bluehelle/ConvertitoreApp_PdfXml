import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import {auth}  from "./FirestoreDataLoader"; // oppure esportalo singolarmente

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const [user, loading] = useAuthState(auth);

  if (loading) return <p>Caricamento...</p>;
  if (!user) return <Navigate to="/" />;

  return children;
}