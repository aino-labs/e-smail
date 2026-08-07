import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../widgets/Sidebar/Sidebar";
import Button from "../../components/Button/Button";
import SendMail from "../../widgets/SendMail/SendMail";
import "./SendEmailPage.scss";
import ProfileModal from "../../widgets/ProfileModal/ProfileModal";
import SupportModal from "../../widgets/SupportModal/SupportModal";
import Input from "../../components/Input/Input";
import { getProfile } from "../../api/ApiAuth";
import { toast } from "../../store/toastStore";
import { useTranslation } from "../../hooks/useTranslation";
import { selectAvatarUrl, useUserStore } from "../../store/useUserStore";
import { useComposerStore } from "../../store/useComposerStore";
import { useMailStore } from "../../store/useMailStore";

import SupportIcon from "@icons/Support.svg";

export default function SendEmailPage() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [selectedFolderId] = useState<number | null>(null);

  const { t } = useTranslation();
  const { isProfileLoaded, setProfileData, name, surname, email } =
    useUserStore();
  const avatarUrl = useUserStore(selectAvatarUrl);
  const { setCurrentFolderId } = useMailStore();
  const { data: composerData, clearComposerData } = useComposerStore();

  // Profile Fetching Logic
  const loadProfile = async () => {
    const data = await getProfile();
    if (data === null) {
      navigate("/login");
      toast.show(t("auth_error"), "error");
    } else {
      setProfileData(data);
    }
  };

  // Run initial loading logic on mount
  useEffect(() => {
    if (!isProfileLoaded) {
      loadProfile();
    }
  }, []);

  // Event Handlers
  const handleAvatar = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleProfileClick = () => {
    setIsModalOpen(false);
    navigate("/profile");
  };

  const handleSettingsClick = () => {
    setIsModalOpen(false);
    navigate("/settings");
  };

  const handleBackToMail = () => {
    clearComposerData();
    setCurrentFolderId(null);
    navigate("/");
  };

  const handleGoToMain = () => {
    clearComposerData;
    setCurrentFolderId(null);
    navigate("/");
  };

  // Sub-renderer for the top bar to keep layout markup neat
  const renderTopBar = () => (
    <div className="top-bar">
      <div className="search-bar">
        <Input
          type="text"
          placeholder={t("search")}
          name="search"
          svg="../../assets/svg/Search.svg"
          onInput={() => {}}
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
  );

  return (
    <div className="send-email-page" onClick={handleCloseModal}>
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      <aside className="sidebar">
        <Sidebar
          isProfile={0}
          newMail={clearComposerData}
          backToMail={handleGoToMain}
          selectedFolderId={selectedFolderId}
          name={name}
          surname={surname}
          email={email}
          avatarUrl={avatarUrl}
        />
      </aside>

      <div className="right-part">
        {renderTopBar()}

        <div className="mail-box-container">
          <SendMail backToMail={handleBackToMail} actionData={composerData} />
        </div>

        <ProfileModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
        />
      </div>
    </div>
  );
}
