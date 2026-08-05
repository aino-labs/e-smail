import { useNavigate } from "react-router-dom";

import "./ProfileModal.scss";
import Button from "../../components/Button/Button";
import { logOut } from "../../api/ApiAuth";
import { useTranslation } from "../../hooks/useTranslation";
import { selectAvatarUrl, useUserStore } from "../../store/useUserStore";
import { useMailStore } from "../../store/useMailStore";

interface ProfileModalProps {
  onClose: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  isOpen: boolean;
}

export default function ProfileModal({
  onClose,
  onProfileClick,
  onSettingsClick,
  isOpen,
}: ProfileModalProps) {
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { name, email, clearProfile } = useUserStore();
  const avatarUrl = useUserStore(selectAvatarUrl);
  const { setFolders, setUnreadCount } = useMailStore();

  const handleExit = async () => {
    await logOut();

    clearProfile();
    setUnreadCount(0);
    setFolders([]);

    navigate("/login");
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    onProfileClick();
    onClose();
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    onSettingsClick();
    onClose();
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
          <Button svg="../../assets/svg/Close.svg" onClick={onClose} />
        </div>
      </div>
      <div className="overlay__avatar">
        <img src={avatarUrl} alt="Avatar"></img>
      </div>
      <div className="overlay__email">
        <p>{email}</p>
      </div>
      <div className="overlay-actions">
        <Button
          title={t("profile")}
          name="profile"
          svg="../../assets/svg/User.svg"
          onClick={handleProfileClick}
        />
        <Button
          title={t("settings")}
          name="settings"
          svg="../../assets/svg/Settings.svg"
          onClick={handleSettingsClick}
        />
      </div>
      <div className="button-exit">
        <Button
          title={t("exit")}
          onClick={(event: any) => {
            event.preventDefault();
            handleExit();
          }}
        />
      </div>
    </div>
  );
}
