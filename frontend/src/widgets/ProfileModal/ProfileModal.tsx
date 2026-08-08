import { useNavigate, Link } from "react-router-dom";

import "./ProfileModal.scss";
import Button from "../../components/Button/Button";
import { logOut } from "../../api/ApiAuth";
import { useTranslation } from "../../hooks/useTranslation";
import { selectAvatarUrl, useUserStore } from "../../store/useUserStore";
import { useMailStore } from "../../store/useMailStore";

import { CloseIcon, UserIcon, SettingsIcon } from "@icons";
import { useAuthStore } from "../../store/useAuthStore";

interface ProfileModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function ProfileModal({ onClose, isOpen }: ProfileModalProps) {
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { name, email, clearProfile } = useUserStore();
  const avatarUrl = useUserStore(selectAvatarUrl);
  const { setFolders, setUnreadCount } = useMailStore();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const handleExit = async () => {
    await logOut();

    clearProfile();
    setUnreadCount(0);
    setFolders([]);
    setAuthenticated(false);

    navigate("/login");
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay shadow"
      onClick={(e: any) => e.stopPropagation()}
    >
      <div className="overlay__title">
        <p>
          {t("hello")}, {name}!
        </p>
        <div className="overlay__close">
          <Button icon={CloseIcon} onClick={onClose} />
        </div>
      </div>
      <div className="overlay__avatar">
        <img src={avatarUrl} alt="Avatar"></img>
      </div>
      <div className="overlay__email">
        <p>{email}</p>
      </div>
      <div className="overlay-actions">
        <Link
          to="/profile/personal"
          className="action-button"
          data-name="profile"
          title={t("profile")}
        >
          <UserIcon />
          <span>{t("profile")}</span>
        </Link>
        <Link
          to="/profile/interface"
          className="action-button"
          data-name="settings"
          title={t("settings")}
        >
          <SettingsIcon />
          <span>{t("settings")}</span>
        </Link>
      </div>
      <div className="button-exit">
        <Button
          title={t("exit")}
          onClick={(event: any) => {
            event.preventDefault();
            handleExit();
          }}
        >
          {t("exit")}
        </Button>
      </div>
    </div>
  );
}
