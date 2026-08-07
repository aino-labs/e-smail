import { useState, useEffect, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "../public/tailwind.css";
import "../public/index.scss";

import LoginPage from "./pages/LoginPage/LoginPage";
import RegPage from "./pages/RegPage/RegPage";
import MainPage from "./pages/MainPage/MainPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import SentPage from "./pages/SentPage/SentPage";
import SendEmailPage from "./pages/SendEmailPage/SendEmailPage";
import ReadEmailPage from "./pages/ReadEmailPage/ReadEmailPage";
import TrashPage from "./pages/TrashPage/TrashPage";
import FavoritePage from "./pages/FavoritePage/FavoritePage";
import SpamPage from "./pages/SpamPage/SpamPage";
import DraftsPage from "./pages/DraftsPage/DraftsPage";
import FolderPage from "./pages/FolderPage/FolderPage";
import AllEmailsPage from "./pages/AllEmailsPage/AllEmailsPage";
import SupportPage from "./pages/SupportPage/SupportPage";
import AdminSupportPage from "./pages/AdminSupportPage/AdminSupportPage";
import Toaster from "./widgets/Toaster/Toaster";
import { initEmailNotifications } from "./utils/emailNotifications";
import "./store/OfflineManager";
import { useSettingsStore } from "./store/useSettingsStore";
import { initCSRFToken } from "./api/ApiAuth";

const AppContent = () => {
  const [isReady, setIsReady] = useState(false);

  const theme = useSettingsStore((state) => state.theme);

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
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegPage />} />
      <Route path="/send" element={<SendEmailPage />} />
      <Route path="/sent" element={<SentPage />} />
      <Route path="/trash" element={<TrashPage />} />
      <Route path="/drafts" element={<DraftsPage />} />
      <Route path="/spam" element={<SpamPage />} />
      <Route path="/favorite" element={<FavoritePage />} />
      <Route path="/all-emails" element={<AllEmailsPage />} />
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
