import { useState } from "react";
import { loginUtente, registraUtente, googleProvider, auth, CreaDocUt } from "./FirestoreDataLoader";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const getColor = (valid: boolean) => (valid ? "green" : "red");

  const validatePassword = (password: string) => ({
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    hasMinLength: password.length >= 6,
  });

  const passwordValidation = validatePassword(password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);


  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await CreaDocUt(user.uid);
      navigate("/app");
    } catch (error) {
      console.error("Errore durante il login con Google:", error);
    }
  };

  const handleLogin = async () => {
    const success = await loginUtente(email, password);
    if (success) navigate("/app");
  };

  const handleRegister = async () => {
    const success = await registraUtente(email, password);
    if (success) navigate("/app");
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
        <div className="tit-container">
          <label className="Titolo">Benvenuto su <br/>Convertitore fatture PDF⮑XML</label>
        </div>
        <div className="body-authF">
          <h2 className="form-title">{isRegistering ? "Registrazione" : "Accedi"}</h2>

          <input
            type="email"
            className="form-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="pass-cell">
            <input
              type={showPassword ? "text" : "password"}
              className="form-input Pass"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div
              onClick={() => setShowPassword(!showPassword)}
              className="eye-EyeOff"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          {isRegistering && (
            <>
              <p className="pass-rules-title">La password DEVE avere:</p>
              <ul className="password-rules">
                <li style={{ color: getColor(passwordValidation.hasMinLength) }}>
                  {passwordValidation.hasMinLength ? "✅" : "❌"} Almeno 6 caratteri
                </li>
                <li style={{ color: getColor(passwordValidation.hasUpperCase) }}>
                  {passwordValidation.hasUpperCase ? "✅" : "❌"} Almeno una lettera MAIUSCOLA
                </li>
                <li style={{ color: getColor(passwordValidation.hasLowerCase) }}>
                  {passwordValidation.hasLowerCase ? "✅" : "❌"} Almeno una lettera minuscola
                </li>
                <li style={{ color: getColor(passwordValidation.hasNumber) }}>
                  {passwordValidation.hasNumber ? "✅" : "❌"} Almeno un numero
                </li>
                <li style={{ color: getColor(passwordValidation.hasSpecialChar) }}>
                  {passwordValidation.hasSpecialChar ? "✅" : "❌"} Almeno un carattere speciale (!@#$...)
                </li>
              </ul>
            </>
          )}

          <div className="button-group">
            {!isRegistering && (
              <>
                <button type="button" className="form-button" onClick={handleLogin}>
                  Accedi
                </button>
                <div className="register-prompt">
                  <label className="prompt-reg">Non sei ancora registrato?</label>
                  <button
                    type="button"
                    className="form-button secondary"
                    onClick={() => setIsRegistering(true)}
                  >
                    Registrati
                  </button>
                </div>
              </>
            )}

            {isRegistering && (
              <>
                <button 
                  type="button" 
                  className="form-button ConfermaR" 
                  onClick={handleRegister}
                  disabled={!isPasswordValid}
                >
                  Registrati
                </button>
                <button
                  type="button"
                  className="form-button  secondary AnnullaR"
                  onClick={() => setIsRegistering(false)}
                >
                  Annulla
                </button>
              </>
            )}

          </div>

          {!isRegistering && (
            <>
              <div className="separator">Oppure</div>

              <div className="google-space">
                <div className="google-icon"></div>
                <div className="div"></div>
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="google-button"
                >
                  Accedi con Google
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}