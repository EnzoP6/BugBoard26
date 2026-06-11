import { createContext, useContext, useState } from "react";
import { login as loginRequest } from "../api/authApi";

const AuthContext = createContext(null);

function getSavedUser() {
  const savedUser = localStorage.getItem("user");

  if (!savedUser || savedUser === "undefined" || savedUser === "null") {
    localStorage.removeItem("user");
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error("Errore lettura user dal localStorage:", error);
    localStorage.removeItem("user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => getSavedUser());

  const isAuthenticated = Boolean(token);

  const login = async (credentials) => {
    const data = await loginRequest(credentials);

    localStorage.setItem("token", data.token);

    const userData = {
      email: data.email,
      role: data.role,
      mustChangePassword: data.mustChangePassword,
    };

    localStorage.setItem("user", JSON.stringify(userData));

    setToken(data.token);
    setUser(userData);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
