import { useState, useEffect, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "../public/tailwind.css";
import "../public/index.scss";

import LoginPage from "./pages/LoginPage/LoginPage";
import RegPage from "./pages/RegPage/RegPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import SendEmailPage from "./pages/SendEmailPage/SendEmailPage";
import ReadEmailPage from "./pages/ReadEmailPage/ReadEmailPage";
import FolderPage from "./pages/FolderPage/FolderPage";
import SupportPage from "./pages/SupportPage/SupportPage";
import AdminSupportPage from "./pages/AdminSupportPage/AdminSupportPage";
import Toaster from "./widgets/Toaster/Toaster";
import { initEmailNotifications } from "./utils/emailNotifications";
import "./store/OfflineManager";
import { useSettingsStore } from "./store/useSettingsStore";
import { initCSRFToken } from "./api/ApiAuth";
import EmailPage from "./pages/EmailPage/EmailPage";
import MainLayout from "./layouts/MainLayout";
import { useAuthStore } from "./store/useAuthStore";
import { useUserStore } from "./store/useUserStore";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

const AppContent = () => {
  const [isReady, setIsReady] = useState(false);

  const theme = useSettingsStore((state) => state.theme);
  const { isAuthenticated } = useAuthStore();
  const { isProfileLoaded } = useUserStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    initCSRFToken().finally(() => {
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return <div className="app-loader">Loading application...</div>;
  }

  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Default redirect: / -> /inbox */}
          <Route path="/" element={<Navigate to="/inbox" replace />} />

          {/* Standard Folders: /inbox, /sent, /trash, /drafts, /starred, /spam */}
          <Route path=":folder" element={<EmailPage />} />

          {/* Custom Folders: /folder/123 */}
          <Route path="folder/:folderId" element={<EmailPage />} />

          {/*{/* Single Email View
          <Route path="read/:id" element={<ReadEmailPage />} />

          {/* Composer View
          <Route path="send" element={<SendEmailPage />} />*/}
        </Route>
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegPage />} />
      <Route path="/send" element={<SendEmailPage />} />
      <Route path="/admin-support" element={<AdminSupportPage />} />
      <Route path="/support" element={<SupportPage />} />

      {/* Dynamic Routes */}
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/:tab" element={<ProfilePage />} />
      <Route path="/read/:id" element={<ReadEmailPage />} />
      <Route path="/folder/:folderId" element={<FolderPage />} />

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => console.error("SW registration failed:", err));
  });
}

initEmailNotifications();

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <BrowserRouter>
      <AppContent />
      <Toaster />
    </BrowserRouter>
  </StrictMode>,
);
