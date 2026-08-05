import { useState, useEffect } from "react";
import "./SupportModal.scss";

interface SupportModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SupportModal({
  isOpen = false,
  onClose,
}: SupportModalProps) {
  const [iframeKey, setIframeKey] = useState(0);

  const closeModal = () => {
    const supportModal = document.querySelector(".support-modal");
    if (supportModal) {
      supportModal.classList.toggle("show");
      if (!supportModal.classList.contains("show")) {
        setIframeKey((prev) => prev + 1);
      }
    }
    onClose?.();
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === "closeSupportModal") {
        closeModal();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const url = new URL(document.URL);

  return (
    <div className={`support-modal${isOpen ? " show" : ""}`}>
      <div className="support-modal-overlay" onClick={closeModal}></div>
      <iframe
        key={iframeKey}
        title="Support Modal"
        className="support-iframe"
        src={`${url.origin}/support`}
        height="200"
        width="200"
      ></iframe>
    </div>
  );
}
