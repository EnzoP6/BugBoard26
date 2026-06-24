import { useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Mail, UserRound, X } from "lucide-react";
import "./styles/UserPage.css";

export default function UserPage({ onClose, onChangePassword}) {
  const navigate = useNavigate();
  const location = useLocation();

  const storedUser = JSON.parse(localStorage.getItem("user"));

  const handleChangePassword = () => {
    onClose();

    navigate("/change-password", {
      state: { backgroundLocation: location },
    });
  };

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <section
        className="user-modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="user-modal-close"
          onClick={onClose}
          aria-label="Close profile popup"
        >
          <X size={20} />
        </button>

        <div className="user-avatar">
          <UserRound size={42} />
        </div>

        <h1>Your profile</h1>

        <p className="user-subtitle">
          Here you can view your account information.
        </p>

        <div className="user-info-box">
          <div className="user-info-icon">
            <Mail size={20} />
          </div>

          <div>
            <span>Email</span>
            <strong>{storedUser?.email}</strong>
          </div>
        </div>

        <div className="user-info-box">
          <div className="user-info-icon">
            <UserRound size={20} />
          </div>

          <div>
            <span>Role</span>
            <strong>{storedUser?.role === "ADMIN" ? "Admin" : "User"}</strong>
          </div>
        </div>

        <button
          type="button"
          className="change-password-link"
          onClick={onChangePassword}
        >
          <KeyRound size={19} />
          Change password
        </button>

      </section>
    </div>
  );
}
