// src/utils/emailNotifications.ts
import { getInboxEmails } from "../api/ApiEmail";
import { translate } from "../hooks/useTranslation";
import { useAuthStore } from "../store/useAuthStore";
import { useSettingsStore } from "../store/useSettingsStore";

let pollingInterval: ReturnType<typeof setInterval> | null = null;
let lastEmailId: string | number | null = null;

const getLang = () => useSettingsStore.getState().language;

// В Safari iOS (вне установленной PWA) window.Notification не существует:
// прямое обращение к Notification.permission кидает ReferenceError.
function notificationsGranted(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

async function fetchLatestEmail() {
  try {
    const data = await getInboxEmails(0);
    if (data && data.emails && data.emails.length > 0) {
      return data.emails[0];
    }
    return null;
  } catch (err) {
    console.error("Email polling error:", err);
    return null;
  }
}

async function sendNotificationToSW(email: any) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sw = reg.active || reg.installing || reg.waiting;
    if (!sw) return;

    sw.postMessage({
      emailId: email.id,
      title: `${translate("new_email_from", getLang())} ${email.sender_email || translate("from_unknown", getLang())}`,
      body: email.header || translate("empty_subject", getLang()),
      icon: "/assets/svg/favicon.svg",
      url: `/read/${email.id}`,
    });
  } catch (err) {
    console.error("Failed to send notification to SW:", err);
  }
}

async function checkForNewEmails() {
  if (!notificationsGranted()) return;

  const email = await fetchLatestEmail();
  if (!email) return;

  if (lastEmailId === null) {
    lastEmailId = email.id;
    return;
  }

  if (email.id !== lastEmailId) {
    await sendNotificationToSW(email);
    lastEmailId = email.id;
  }
}

function startPolling() {
  if (pollingInterval) return;
  if (!notificationsGranted()) return;

  // Read notifications preference directly from Zustand
  const { notificationsEnabled } = useSettingsStore.getState();
  if (!notificationsEnabled) return;

  lastEmailId = null;
  checkForNewEmails();
  pollingInterval = setInterval(checkForNewEmails, 30000);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  lastEmailId = null;
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert(translate("notifs_not_supported", getLang()));
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      startPolling();
    }
  }
}

let unsubscribeAuth: (() => void) | null = null;
let unsubscribeSettings: (() => void) | null = null;

export function initEmailNotifications() {
  if (!("serviceWorker" in navigator)) return;

  const checkAndTogglePolling = () => {
    const { isAuthenticated } = useAuthStore.getState();
    const { notificationsEnabled } = useSettingsStore.getState();

    if (isAuthenticated && notificationsGranted() && notificationsEnabled) {
      startPolling();
    } else {
      stopPolling();
    }
  };

  // Subscribe to Zustand store changes
  unsubscribeAuth = useAuthStore.subscribe(checkAndTogglePolling);
  unsubscribeSettings = useSettingsStore.subscribe(checkAndTogglePolling);

  // Initial check
  checkAndTogglePolling();
}

export function destroyEmailNotifications() {
  stopPolling();
  if (unsubscribeAuth) {
    unsubscribeAuth();
    unsubscribeAuth = null;
  }
  if (unsubscribeSettings) {
    unsubscribeSettings();
    unsubscribeSettings = null;
  }
}
