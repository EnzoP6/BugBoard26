import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, LogIn, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./styles/LoginPage.css";
import logo from "../assets/bugboard-login.png";
import logob from "../assets/bugboard-logob.png";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@bugboard26.it");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login({
        email,
        password,
      });

      if (data.mustChangePassword) {
        navigate("/change-password");
      } else {
        navigate("/issues");
      }
    } catch (error) {
      console.error(error);
      setError("Invalid e-mail or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="background-dots"></div>
      <img src={logob} alt="" className="background-logo-img" aria-hidden="true" />

      <section className="login-card">
        <div className="brand-area">
          <img src={logo} alt="BugBoard26 logo" className="brand-logo-img"/>

          <h1>BugBoard26</h1>

          <p>Track. Manage. Solve.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>

            <div className="input-wrapper">
              <UserRound className="input-icon" size={24} />

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="input-wrapper">
              <Lock className="input-icon" size={23} />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Show or hide password"
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            <LogIn size={23} />

            {loading ? "Accesso in corso..." : "Log in"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
