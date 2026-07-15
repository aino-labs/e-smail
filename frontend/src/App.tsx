import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegPage from "./pages/RegPage/RegPage";
import "../public/index.scss";
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
import { AppStorage } from "./stores/AppStorage";
import "./stores/OfflineManager";

const routes: Record<string, React.ComponentType<any>> = {
  "/login": LoginPage,
  "/register": RegPage,
  "/profile": ProfilePage,
  "/send": SendEmailPage,
  "/sent": SentPage,
  "/": MainPage,
  "/trash": TrashPage,
  "/drafts": DraftsPage,
  "/spam": SpamPage,
  "/favorite": FavoritePage,
  "/all-emails": AllEmailsPage,
  "/admin-support": AdminSupportPage,
  "/support": SupportPage,
};

const dynamicRoutes = [
  {
    pattern: /^\/read\/(\d+)$/,
    component: ReadEmailPage,
    paramName: "id",
  },
  {
    pattern: /^\/folder\/(\d+)$/,
    component: FolderPage,
    paramName: "folderId",
  },
  {
    pattern: /^\/profile\/(personal|password|interface|folders|support)$/,
    component: ProfilePage,
    paramName: "tab",
  },
];

function getComponent(path: string) {
  let Component = routes[path];
  const props: any = {};

  if (!Component) {
    for (const route of dynamicRoutes) {
      const match = path.match(route.pattern);
      if (match) {
        Component = route.component;
        props[route.paramName] = match[1];
        break;
      }
    }
  }

  return { Component: Component || routes["/"], props };
}

const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path === currentPath) return;
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  const { Component, props } = getComponent(currentPath);

  return <Component {...props} navigate={navigate} />;
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

AppStorage.init();
(window as any).AppStorage = AppStorage;

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
  <>
    <App />
    <Toaster />
  </>,
);
