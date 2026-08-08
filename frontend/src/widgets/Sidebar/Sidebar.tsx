import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/Button/Button";
import "./Sidebar.scss";
import SidebarProfile from "../../components/SidebarProfile/SidebarProfile";
import { useTranslation } from "../../hooks/useTranslation";
import { useUIStore } from "../../store/useUIStore";
import { useMailStore } from "../../store/useMailStore";

import {
  DraftIcon,
  ComposeIcon,
  InboxIcon,
  SentIcon,
  StarOffIcon,
  DropdownArrowIcon,
  SpamIcon,
  TrashIcon,
  FolderIcon,
} from "@icons";
import SidebarItem from "../../components/SidebarItem/SidebarItem";

interface SidebarProps {
  isProfile: boolean;
  isPressProfile?: number;
  backToMail: () => void;
  changeProfile?: () => void;
  changePassword?: () => void;
  newMail: () => void;
  name: string;
  surname: string;
  email: string;
  avatarUrl: string;
  handleSetting?: () => void;
  handleFolder?: () => void;
  handleSupport?: () => void;
  selectedFolderId?: number | null;
}

export default function Sidebar({
  isProfile = false,
  isPressProfile,
  backToMail,
  changeProfile,
  changePassword,
  newMail,
  name,
  surname,
  email,
  avatarUrl,
  handleSetting,
  handleFolder,
  handleSupport,
  selectedFolderId,
}: SidebarProps) {
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { currentView, setCurrentView } = useUIStore();
  const sidebarDropdownVisible = useUIStore(
    (state) => state.sidebarDropdownVisible,
  );
  const setSidebarDropdownVisible = useUIStore(
    (state) => state.setSidebarDropdownVisible,
  );
  const {
    unreadCount,
    draftCount,
    spamCount,
    folders,
    setCurrentFolderId,
    currentFolderId,
  } = useMailStore();

  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 769);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDropdown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const newState = !sidebarDropdownVisible;
    setSidebarDropdownVisible(newState);

    const button = event.currentTarget;
    button.classList.toggle("active");
  };

  const toggleSidebar = () => {
    const sidebar = document.querySelector(".sidebar");
    const sidebarOverlay = document.querySelector(".sidebar-overlay");
    if (sidebar) {
      sidebar.classList.toggle("open");
    }
    if (sidebarOverlay) {
      sidebarOverlay.classList.toggle("open");
    }
  };

  const handleFolderClick = (folderId: number) => {
    setCurrentFolderId(folderId);
    setCurrentView("folder");
    navigate(`/folder/${folderId}`);
    toggleSidebar();
  };

  const handleInboxClick = (event: React.MouseEvent) => {
    event.preventDefault();
    setCurrentView("inbox");
    setCurrentFolderId(null);
    navigate("/");
    toggleSidebar();
  };

  const handleDraftsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setCurrentView("drafts");
    navigate("/drafts");
    toggleSidebar();
  };

  const handleSentClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setCurrentView("sent");
    navigate("/sent");
    toggleSidebar();
  };

  const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setCurrentView("favorite");
    navigate("/favorite");
    toggleSidebar();
  };

  const handleSpamClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setCurrentView("spam");
    navigate("/spam");
    toggleSidebar();
  };

  const handleTrashClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setCurrentView("trash");
    navigate("/trash");
    toggleSidebar();
  };

  const handleAllMailClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setCurrentView("all-emails");
    setCurrentFolderId(null);
    navigate("/all-emails");
    toggleSidebar();
  };

  return (
    <div className="sidebar-widget">
      {isMobile && isProfile ? (
        <div
          className="sidebar-settings-back-button-mobile"
          onClick={backToMail}
        >
          {" "}
          <div className="arrow-left-icon" />
          <span>{t("back_to_mail")}</span>
        </div>
      ) : null}
      <div className="logo-container" onClick={handleInboxClick}>
        <img src="../../assets/svg/Logo.svg" alt="SMail logo" />
        <h1 className="logo__title">SMail</h1>
      </div>
      {!isProfile && (
        <div className="sidebar-content">
          <div className="main-button">
            <SidebarItem
              to="/send"
              icon={ComposeIcon}
              iconSize="28"
              label={t("new_letter")}
              variant="highlight"
            />
          </div>
          <div className="main-button-container">
            <SidebarItem
              to="/"
              icon={InboxIcon}
              iconSize="28"
              label={t("inbox")}
              variant="regular"
              badge={unreadCount > 0 ? unreadCount : undefined}
              isActive={currentView === "inbox"}
            />
            <SidebarItem
              to="/drafts"
              icon={DraftIcon}
              iconSize="28"
              label={t("drafts")}
              variant="regular"
              badge={spamCount > 0 ? spamCount : undefined}
              isActive={currentView === "drafts"}
            />
            <SidebarItem
              to="/sent"
              icon={SentIcon}
              iconSize="28"
              label={t("sent")}
              variant="regular"
              isActive={currentView === "sent"}
            />
            <SidebarItem
              to="/favorite"
              icon={StarOffIcon}
              iconSize="28"
              label={t("favorite")}
              variant="regular"
              isActive={currentView === "favorite"}
            />
          </div>

          <div className="drop-down">
            <Button
              icon={DropdownArrowIcon}
              iconSize="28"
              variant="sidebar"
              name="button-drop-down"
              title={sidebarDropdownVisible ? t("hide") : t("yet")}
              onClick={toggleDropdown}
              active={sidebarDropdownVisible}
            >
              {sidebarDropdownVisible ? t("hide") : t("yet")}
            </Button>
            {sidebarDropdownVisible && (
              <div className="extra-button-container">
                <SidebarItem
                  to="/spam"
                  icon={SpamIcon}
                  iconSize="28"
                  label={t("spam")}
                  variant="regular"
                  nestedLevel={"1"}
                  isActive={currentView === "spam"}
                />
                <SidebarItem
                  to="/trash"
                  icon={TrashIcon}
                  iconSize="28"
                  label={t("trash")}
                  variant="regular"
                  nestedLevel={"1"}
                  isActive={currentView === "trash"}
                />
                {/*
              <Button
                name="button-all-letter"
                title={this.t("all_letter")}
                isSelect={currentView === "all-emails"}
                onClick={this.handleAllMailClick}
              />
              */}
                {folders &&
                  folders.map((folder: any) => (
                    <div key={folder.id} className="folder-item">
                      <SidebarItem
                        to={`/folder/${folder.id}`}
                        icon={FolderIcon}
                        iconSize="28"
                        label={folder.name}
                        variant="regular"
                        nestedLevel={"1"}
                        isActive={currentFolderId === folder.id}
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
      {isProfile && (
        <div className="sidebar-content">
          <SidebarProfile name={name} surname={surname} email={email} />
          <div className="main-button-profile">
            <Button
              title={t("mailbox")}
              name="button-back-letter"
              onClick={(event: any) => {
                event.preventDefault();
                backToMail();
              }}
            />
          </div>
          <div
            className={`main-button-container ${isMobile ? "mobile-tiles" : ""}`}
          >
            <Button
              name="button-profile"
              title={t("personal_information")}
              isSelect={isPressProfile === 0}
              onClick={(event: any) => {
                event.preventDefault();
                changeProfile?.();
                toggleSidebar();
              }}
            />
            <Button
              name="button-security"
              title={t("security")}
              isSelect={isPressProfile === 1}
              onClick={(event: any) => {
                event.preventDefault();
                changePassword?.();
                toggleSidebar();
              }}
            />
            <Button
              name="button-settings"
              title={t("settings")}
              isSelect={isPressProfile === 2}
              onClick={(event: any) => {
                event.preventDefault();
                handleSetting?.();
                toggleSidebar();
              }}
            />
            <Button
              name="button-folder"
              title={t("folder")}
              isSelect={isPressProfile === 3}
              onClick={(event: any) => {
                event.preventDefault();
                handleFolder?.();
                toggleSidebar();
              }}
            />
            <Button
              name="button-support"
              title={t("support")}
              isSelect={isPressProfile === 4}
              onClick={(event: any) => {
                event.preventDefault();
                handleSupport?.();
                toggleSidebar();
              }}
            />
          </div>
        </div>
      )}
      {!isProfile ? (
        <SidebarProfile
          name={name}
          surname={surname}
          email={email}
          variant="mobile"
          textAlign="text-left"
        />
      ) : null}
    </div>
  );
}
