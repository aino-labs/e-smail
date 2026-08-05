import { useSyncExternalStore } from "react";
import Notification from "./Notification";
import { toast } from "../../store/toastStore";

export default function Toaster() {
  const toasts = useSyncExternalStore(toast.subscribe, toast.getSnapshot);

  return (
    <div className="popup-manager">
      {toasts.map((item, index) => (
        <Notification
          key={item.id}
          isOpen={true}
          onClose={() => toast.dismiss(item.id)}
          isStatus={item.type === "success"}
          message={item.message}
          index={index}
        />
      ))}
    </div>
  );
}
