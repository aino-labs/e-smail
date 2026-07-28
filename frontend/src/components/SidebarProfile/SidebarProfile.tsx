import { AppStorage } from "../../stores/AppStorage";
import "./SidebarProfile.scss";
import Button from "../Button/Button";
import { logOut } from "../../api/ApiAuth";

interface SidebarProfileProps {
  name?: string;
  surname?: string;
  email?: string;
  avatarUrl?: string;
  variant?: string;
  textAlign?: string;
  navigate: (path: string) => void;
}

export default function SidebarProfile({
  name = AppStorage.name,
  surname = AppStorage.surname,
  email = AppStorage.email,
  avatarUrl = AppStorage.image_path,
  variant = "",
  textAlign = "",
  navigate,
}: SidebarProfileProps) {
  const handleAvatar = () => {
    navigate("/profile");
  };

  const handleExit = async () => {
    await logOut();

    AppStorage.setUnReadCount(0);

    navigate("/login");
  };

  return (
    <div className={`sidebar-profile ${variant}`}>
      {variant === "mobile" ? (
        <Button
          className="sidebar-profile__profile-btn"
          svg={AppStorage.getAvatarUrl()}
          name="avatar"
          help="Аккаунт"
          onClick={handleAvatar}
        />
      ) : (
        <img src={avatarUrl || "../../assets/svg/Avatar.svg"}></img>
      )}
      <div
        className={`sidebar-profile__text ${textAlign}`}
        onClick={variant === "mobile" ? handleAvatar : () => {}}
      >
        <span className="sidebar-profile__name">
          {name} {surname}
        </span>
        <p className="sidebar-profile__email">{email}</p>
      </div>
      {variant === "mobile" ? (
        <div className="sidebar-profile__logout-btn" onClick={handleExit} />
      ) : null}
    </div>
  );
}
