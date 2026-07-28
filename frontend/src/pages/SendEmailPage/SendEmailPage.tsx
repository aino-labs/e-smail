import React, { useState, useEffect } from "react";
import Sidebar from "../../widgets/Sidebar/Sidebar";
import Button from "../../components/Button/Button";
import SendMail from "../../widgets/SendMail/SendMail";
import "./SendEmailPage.scss";
import ProfileModal from "../../widgets/ProfileModal/ProfileModal";
import NotificationManager from "../../widgets/Toaster/Toaster";
import Input from "../../components/Input/Input";
import { AppStorage } from "../../stores/AppStorage";
import { getProfile } from "../../api/ApiAuth";
import { toast } from "../../stores/toastStore";

interface SendEmailPageProps {
  navigate: (route: string) => void;
}

const SendEmailPage: React.FC<SendEmailPageProps> = ({ navigate }) => {
  // State Declarations
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [replyData, setReplyData] = useState<any>(null);
  const [forwardData, setForwardData] = useState<any>(null);
  const [currentView, setCurrentView] = useState<string>("send");
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  const t = (key: string): string => AppStorage.t(key);
  const mailActionData = replyData || forwardData;

  // Profile Fetching Logic
  const loadProfile = async () => {
    const data = await getProfile();
    if (data === null) {
      navigate("/login");
      toast.show("auth_error", "error");
    } else {
      AppStorage.setProfileData(data);
    }
  };

  // Run initial loading logic on mount
  useEffect(() => {
    setReplyData(AppStorage.getReplyData());
    setForwardData(AppStorage.getForwardData());

    if (!AppStorage.isProfileLoaded) {
      AppStorage.isProfileLoaded = true;
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

  const handleNewMail = () => {
    AppStorage.clearMailActionData();
    setReplyData(null);
    setForwardData(null);
  };

  const handleBackToMail = () => {
    AppStorage.clearMailActionData();
    AppStorage.setCurrentFolderId(null);
    AppStorage.setCurrentView("inbox");
    navigate("/");
  };

  const handleGetSendEmail = () => {
    AppStorage.setCurrentView("sent");
    navigate("/sent");
  };

  const handleGetDrafts = () => {
    AppStorage.setCurrentView("drafts");
    navigate("/");
  };

  const handleGetSpam = () => {
    AppStorage.setCurrentView("spam");
    navigate("/");
  };

  const handleGetTrash = () => {
    AppStorage.setCurrentView("trash");
    navigate("/");
  };

  const handleGetFavorite = () => {
    AppStorage.setCurrentView("favorite");
    navigate("/");
  };

  const handleGoToMain = () => {
    AppStorage.setCurrentView("inbox");
    AppStorage.clearMailActionData();
    AppStorage.setCurrentFolderId(null);
    navigate("/");
  };

  const loadEmailFromFolder = async (offset: number, folderID: number) => {
    AppStorage.setCurrentFolderId(folderID);
    AppStorage.setCurrentView("folder");
    setSelectedFolderId(folderID);
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
          svg={AppStorage.getAvatarUrl()}
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
          newMail={handleNewMail}
          backToMail={handleGoToMain}
          selectedFolderId={selectedFolderId}
          name={AppStorage.name}
          surname={AppStorage.surname}
          email={AppStorage.email}
          avatarUrl={AppStorage.getAvatarUrl()}
          navigate={navigate}
        />
      </aside>

      <div className="right-part">
        {renderTopBar()}

        <div className="mail-box-container">
          <SendMail backToMail={handleBackToMail} actionData={mailActionData} />
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
