import { CheckCircle2, AlertTriangle, X, House } from "lucide-react";
import "./StatusPopup.css";

export default function StatusPopup({type = "success", title, message, onClose, actionLabel, onAction, homeLabel, onHome,}) {
  const isSuccess = type === "success";

  return (
    <div className="status-popup-overlay" onClick={onClose}>
      <section
        className={`status-popup-card ${isSuccess ? "success" : "error"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="status-popup-close"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="Close message popup"
        >
          <X size={18} />
        </button>

        <div className="status-popup-icon">
          {isSuccess ? <CheckCircle2 size={34} /> : <AlertTriangle size={34} />}
        </div>

        <h2>{title}</h2>
        <p>{message}</p>

        <div className="status-popup-actions">
          {homeLabel && onHome && (
            <button
              type="button"
              className="status-popup-home-button"
              onClick={onHome}
            >
              <House size={16} />
              {homeLabel}
            </button>
          )}

          {actionLabel && onAction ? (
            <button
              type="button"
              className="status-popup-button"
              onClick={onAction}
            >
              {actionLabel}
            </button>
          ) : (
            <button
              type="button"
              className="status-popup-button"
              onClick={onClose}
            >
              Got it
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
