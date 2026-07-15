import { useRef, useEffect } from 'react'
import { AppStorage } from "../../stores/AppStorage";
import "./Notification.scss";

const t = (key: string): string => {
  return AppStorage.t(key);
}

interface NotificationProps {
  onClose: () => void;
  isOpen: boolean;
  isStatus?: boolean;
  message?: string;
  index: number;
}

export default function Notification({
  onClose,
  isOpen,
  isStatus,
  message,
  index
}: NotificationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const popupLength = window.innerWidth < 769 ? 2000 : 4000;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onClose();
    }, popupLength);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  })

  const handleClose = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  const bottomOffset = 40 + index * 60;

  return (<div
    className={`confirmation-modal ${isStatus ? "access" : "error"}`}
    onClick={handleClose}
    style={{ bottom: `${bottomOffset}px` }}
  >
    <div className="__title">
      {isStatus
        ? t(message || "saved_successfully")
        : t(message || "server_error")}
    </div>
  </div>
);
}
