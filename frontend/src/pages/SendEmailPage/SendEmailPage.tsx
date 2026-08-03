import React, { useState, useEffect } from "react";
import Sidebar from "../../widgets/Sidebar/Sidebar";
import Button from "../../components/Button/Button";
import SendMail from "../../widgets/SendMail/SendMail";
import "./SendEmailPage.scss";
import ProfileModal from "../../widgets/ProfileModal/ProfileModal";
import Input from "../../components/Input/Input";
import { getProfile } from "../../api/ApiAuth";
import { toast } from "../../store/toastStore";
import { useTranslation } from "../../hooks/useTranslation";
import { useUserStore } from "../../store/useUserStore";
import { useComposerStore } from "../../store/useComposerStore";
import { useMailStore } from "../../store/useMailStore";

interface SendEmailPageProps {
  navigate: (route: string) => void;
}

const SendEmailPage: React.FC<SendEmailPageProps> = ({ navigate }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedFolderId] = useState<number | null>(null);

  const { t } = useTranslation();
  const {
    isProfileLoaded,
    setProfileData,
    getAvatarUrl,
    name,
    surname,
    email,
  } = useUserStore();
  const { setCurrentFolderId } = useMailStore();
  const { data: composerData, clearComposerData } = useComposerStore();

  // Profile Fetching Logic
  const loadProfile = async () => {
    const data = await getProfile();
    if (data === null) {
      navigate("/login");
      toast.show("auth_error", "error");
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
          svg={getAvatarUrl()}
          name="avatar"
          help="Аккаунт"
          onClick={handleAvatar}
        />
      </div>
    </div>
  );

  return (
    <div className="send-email-page" onClick={handleCloseModal}>
      <aside className="sidebar">
        <Sidebar
          isProfile={0}
          newMail={clearComposerData}
          backToMail={handleGoToMain}
          selectedFolderId={selectedFolderId}
          name={name}
          surname={surname}
          email={email}
          avatarUrl={getAvatarUrl()}
          navigate={navigate}
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
          navigate={navigate}
        />
      </div>
    </div>
  );
};

export default SendEmailPage;
