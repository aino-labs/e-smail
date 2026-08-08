import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../widgets/Sidebar/Sidebar"; // or widgets/Sidebar
import ProfileModal from "../widgets/ProfileModal/ProfileModal";
import SupportModal from "../widgets/SupportModal/SupportModal";
import { useUserStore, selectAvatarUrl } from "../store/useUserStore";
import Input from "../components/Input/Input";
import Button from "../components/Button/Button";
import { SupportIcon } from "@icons";
import { useTranslation } from "../hooks/useTranslation";
import { searchEmail } from "../api/ApiEmail";

export default function MainLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { name, surname, email } = useUserStore();
  const avatarUrl = useUserStore(selectAvatarUrl);

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleSidebar = () => {
    const sidebar = document.querySelector(".sidebar");
    const sidebarOverlay = document.querySelector(".sidebar-overlay");
    sidebar?.classList.toggle("open");
    sidebarOverlay?.classList.toggle("open");
  };

  const handleSearch = async (data: string) => {
    if (!data || data.trim() === "") return;
    try {
      await searchEmail(data);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleAvatar = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setIsProfileOpen(true);
  };

  return (
    <div className="main-page">
      <aside className="sidebar">
        <Sidebar
          name={name}
          surname={surname}
          avatarUrl={avatarUrl}
          email={email}
          isProfile={false}
          newMail={() => navigate("/send")}
          backToMail={() => navigate("/")}
        />
      </aside>

      <div className="right-part">
        <div className="top-bar">
          <div
            className="hamburger-btn"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              toggleSidebar();
            }}
          >
            <div className="hamburger-icon" />
          </div>
          <div className="search-bar">
            <Input
              type="text"
              placeholder={t("search")}
              name="search"
              svg="../../assets/svg/Search.svg"
              onInput={(e: any) => handleSearch(e.target.value)}
            />
          </div>
          <div className="top-right-menu">
            <Button
              icon={SupportIcon}
              iconSize="28"
              title={t("support")}
              className="text-tertiary-text"
              onClick={() => setIsSupportOpen(true)}
            />
            <Button name="avatar" title="Аккаунт" onClick={handleAvatar}>
              <img src={avatarUrl}></img>
            </Button>
          </div>
        </div>

        <Outlet context={{ openSupport: () => setIsSupportOpen(true) }} />
      </div>

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
