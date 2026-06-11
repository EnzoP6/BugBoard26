import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, X, Save,} from "lucide-react";
import { changePassword } from "../api/authApi";
import StatusPopup from "../components/StatusPopup";
import "./ChangePasswordPage.css";

function ChangePasswordPage({ onClose, onSuccess,isPopup = false }) {
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  const handleClose = () => {
    if (isPopup && onClose) {
      onClose();
      return;
    }

    navigate("/issues");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Compila tutti i campi.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La nuova password deve contenere almeno 8 caratteri.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        oldPassword,
        newPassword,
      });

      if (isPopup && onSuccess) {
        onSuccess();
        return;
      }

      setPopupMessage({
        type: "success",
        title: "Password changed",
        message: "Your password has been updated successfully.",
      });

    } catch (error) {
      console.error("Errore cambio password:", error.response?.data || error);

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Errore durante il cambio password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-overlay">
      <div className="change-password-modal">
        <button
          type="button"
          className="change-password-close"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="change-password-header">
          <div className="change-password-icon">
            <LockKeyhole size={28} />
          </div>

          <div>
            <div className="change-password-kicker">
              <Sparkles size={15} />
              Account security
            </div>

            <h1>Cambia password</h1>

            <p>
              Aggiorna le tue credenziali per mantenere sicuro il tuo account
              BugBoard26.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="change-password-field">
            <label>Password attuale</label>

            <div className="change-password-input-wrapper">
              <input
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                placeholder="Inserisci password attuale"
              />

              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="change-password-eye"
                aria-label="Show old password"
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="change-password-field">
            <label>Nuova password</label>

            <div className="change-password-input-wrapper">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Almeno 8 caratteri"
              />

              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="change-password-eye"
                aria-label="Show new password"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="change-password-field">
            <label>Conferma nuova password</label>

            <div className="change-password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Ripeti nuova password"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="change-password-eye"
                aria-label="Show confirm password"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="change-password-security-note">
            <ShieldCheck size={18} />
            <span>Usa una password diversa da quella precedente.</span>
          </div>

          <div className="change-password-actions">
            <button
              type="button"
              className="change-password-cancel"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="change-password-submit"
              disabled={loading}
            >
              <Save size={17} />
              {loading ? "Saving..." : "Save password"}
            </button>
          </div>

          {error && (
            <div className="change-password-message error">
              {error}
            </div>
          )}
        </form>
      </div>
      
      {popupMessage && (
        <StatusPopup
          type={popupMessage.type}
          title={popupMessage.title}
          message={popupMessage.message}
          onClose={() => {
            setPopupMessage(null);
            navigate("/issues");
          }}
        />
      )}
    </div>
  );
}

export default ChangePasswordPage;