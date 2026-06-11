import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";
import IssuesPage from "./pages/IssuesPage.jsx";
import IssueDetailPage from "./pages/IssueDetailPage.jsx";
import NewIssuePage from "./pages/NewIssuePage.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import NewUserPage from "./pages/NewUserPage";
import UserPage from "./pages/UserPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/issues" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/change-password"
          element={
            <>
              <IssuesPage />
              <ChangePasswordPage />
            </>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/issues/new" element={<NewIssuePage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />
          <Route path="/users/new" element={<NewUserPage />} />
          <Route path="/user" element={<UserPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;