import "./ProfileModal.scss";
import Button from "../../components/Button/Button";
import { logOut } from "../../api/ApiAuth";
import { AppStorage } from "../../utils/AppStorage";

interface ProfileModalProps {
  onClose: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  navigate: (path: string) => void;
  isOpen: boolean;
}

const t = (key: string): string => {
  return AppStorage.t(key);
}

export default function ProfileModal({
  onClose,
  onProfileClick,
  onSettingsClick,
  navigate,
  isOpen
}: ProfileModalProps) {
  const handleExit = async () => {
    await logOut();

    AppStorage.setProfileData({
      name: "",
      surname: "",
      email: "",
      image_path: "",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
      is_male: false,
      anonymousEnabled: false,
    });
    AppStorage.setUnReadCount(0);
    AppStorage.setFolders([]);
    AppStorage.isProfileLoaded = false;

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
          {t("hello")}, {AppStorage.name}!
        </p>
        <div className="overlay__close">
          <Button
            svg="../../assets/svg/Close.svg"
            onClick={onClose}
          />
        </div>
      </div>
      <div className="overlay__avatar">
        <img src={AppStorage.getAvatarUrl()} alt="Avatar"></img>
      </div>
      <div className="overlay__email">
        <p>{AppStorage.email}</p>
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
