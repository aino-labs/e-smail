import { useNavigate } from "react-router-dom";

import "./SidebarProfile.scss";
import Button from "../Button/Button";
import { logOut } from "../../api/ApiAuth";
import { useMailStore } from "../../store/useMailStore";
import { selectAvatarUrl, useUserStore } from "../../store/useUserStore";

interface SidebarProfileProps {
  name?: string;
  surname?: string;
  email?: string;
  variant?: string;
  textAlign?: string;
}

export default function SidebarProfile({
  name = "",
  surname = "",
  email = "",
  variant = "",
  textAlign = "",
}: SidebarProfileProps) {
  const navigate = useNavigate();

  const setUnreadCount = useMailStore((state) => state.setUnreadCount);
  const avatarUrl = useUserStore(selectAvatarUrl);
  const handleAvatar = () => {
    navigate("/profile");
  };

  const handleExit = async () => {
    await logOut();

    setUnreadCount(0);

    navigate("/login");
  };

  return (
    <div className={`sidebar-profile ${variant}`}>
      {variant === "mobile" ? (
        <Button
          className="sidebar-profile__profile-btn"
          svg={avatarUrl}
          name="avatar"
          help="Аккаунт"
          onClick={handleAvatar}
        />
      ) : (
        <img src={avatarUrl}></img>
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
