import { useState } from "react";
import { createUser } from "../api/usersApi";
import { Eye, EyeOff, ShieldCheck, Lock, Sparkles } from "lucide-react";
import "../styles/NewUserPage.css";

export default function NewUserPage({ onClose, onSuccess }) {

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = storedUser?.role === "ADMIN";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "USER",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return (
      <div className="new-user-modal-overlay" onClick={onClose}>
        <section className="new-user-card" onClick={(event) => event.stopPropagation()} >
          <div className="new-user-header">
            <div>
              <h2>Access denied</h2>
              <p>Only administrators can create new users.</p>
            </div>

            <button type="button" className="new-user-close" onClick={onClose} aria-label="Close" >
              ×
            </button>
          </div>
        </section>
      </div>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => ({...prevData, [name]: value, }));
    setPopupMessage(null);
  };

  const handleRoleChange = (role) => {
    setFormData((prevData) => ({...prevData, role, }));
    setPopupMessage(null);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      role: "USER",
    });

    setPopupMessage(null);
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      return "Email address is required.";
    }

    if (!formData.email.includes("@")) {
      return "Please enter a valid email address.";
    }

    if (!formData.password.trim()) {
      return "Password is required.";
    }

    if (formData.password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (!formData.role) {
      return "Please select a user role.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setPopupMessage({
        type: "error",
        title: "Check the fields",
        message: validationError,
      });
      return;
    }

    setLoading(true);
    setPopupMessage(null);

    try {
      await createUser({
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      resetForm();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);

      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error while creating the user.";

      setPopupMessage({
        type: "error",
        title: "User not created",
        message: backendMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-user-modal-overlay" onClick={onClose}>
      <section className="new-user-card" onClick={(event) => event.stopPropagation()} >
        <div className="new-user-header">
          <div className="new-user-title-area">
            <div className="new-user-icon">
              <span>♙</span>
              <small>+</small>
            </div>

            <div>
              <h2>New user creation</h2>
              <p>Fill in the details below to create a new user.</p>
            </div>
          </div>

          <button
            type="button"
            className="new-user-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="new-user-form">
          <div className="new-user-field">
            <label htmlFor="email">
              Email address <span>*</span>
            </label>

            <div className="new-user-input-wrapper">
              <span className="new-user-input-icon">✉</span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="new-user-field">
            <label htmlFor="password">
              Password <span>*</span>
            </label>

            <div className="new-user-input-wrapper">
              <span className="new-user-input-icon">
                <Lock size={18} strokeWidth={1.8} />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />

              
              <button
                type="button"
                className="new-user-eye"
                onClick={() => setShowPassword((prevValue) => !prevValue)}
                aria-label="Show password"
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
          </div>

          <div className="new-user-field">
            <label>
              User role <span>*</span>
            </label>

            <div className="new-user-role-grid">
              <button
                type="button"
                className={`new-user-role-card ${
                  formData.role === "USER" ? "selected" : ""
                }`}
                onClick={() => handleRoleChange("USER")}
                disabled={loading}
              >
                <span className="new-user-radio"></span>

                <span className="new-user-role-icon normal-role-icon">♙</span>

                <span>
                  <strong>Normal user</strong>
                  <small>Standard access with limited permissions</small>
                </span>
              </button>

              <button
                type="button"
                className={`new-user-role-card ${
                  formData.role === "ADMIN" ? "selected" : ""
                }`}
                onClick={() => handleRoleChange("ADMIN")}
                disabled={loading}
              >
                <span className="new-user-radio"></span>

                <span className="new-user-role-icon admin-role-icon">
                  <ShieldCheck size={28} strokeWidth={1.9} />
                  <span className="admin-role-accent">
                    <Sparkles size={10} strokeWidth={2.4} />
                  </span>
                </span>

                <span>
                  <strong>Admin</strong>
                  <small>Full access with all permissions</small>
                </span>
              </button>
            </div>
          </div>

          {popupMessage && (
            <div className={`new-user-inline-message ${popupMessage.type}`}>
              <strong>{popupMessage.title}</strong>
              <p>{popupMessage.message}</p>
            </div>
          )}

          <div className="new-user-actions">
            <button
              type="button"
              className="new-user-cancel"
              onClick={resetForm}
              disabled={loading}
            >
              Cancel
            </button>

            <button type="submit" className="new-user-submit" disabled={loading}>
              <span>♙+</span>
              {loading ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
