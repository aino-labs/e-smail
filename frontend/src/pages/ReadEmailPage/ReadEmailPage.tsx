import { useState, useEffect } from "react";
import Sidebar from "../../widgets/Sidebar/Sidebar"; // Adjust relative paths as needed
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import ReadMail from "../../widgets/ReadMail/ReadMail";
import ProfileModal from "../../widgets/ProfileModal/ProfileModal";
import { getEmailByID } from "../../api/ApiEmail";
import { AppStorage } from "../../store/AppStorage";
import { useTranslation } from "../../hooks/useTranslation";

interface ReadEmailPageProps {
  id: number | string;
  navigate: (path: string) => void;
  previousPath: string;
}

interface EmailState {
  id: string | number;
  header: string;
  body: string;
  createdAt: string;
  senderEmail: string;
  senderImage: string;
  senderName: string;
  senderSurname: string;
  receiverList: any[];
  is_anonymous?: boolean;
  is_favorite?: boolean;
}

export default function ReadEmailPage({
  id,
  navigate,
  previousPath,
}: ReadEmailPageProps) {
  const { t, language } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isPress, setIsPress] = useState<number>(0);
  const [currentView] = useState<string>("read");

  // Lazy state initialization prevents calling AppStorage on every single render
  const [selectedFolderId] = useState<any>(
    () => AppStorage.getCurrentFolderId?.() || null,
  );

  const [email, setEmail] = useState<EmailState>({
    id: "",
    header: "",
    body: "",
    createdAt: "",
    senderEmail: "",
    senderImage: "",
    senderName: "",
    senderSurname: "",
    receiverList: [],
  });

  useEffect(() => {
    const loadEmail = async () => {
      const strID = window.location.pathname.split("/").pop();
      const parsedId = strID ? parseInt(strID, 10) : 0;
      const data = await getEmailByID(parsedId);

      if (!data) {
        navigate("/");
        return;
      }

      AppStorage.cacheSingleEmail(data);

      setIsPress(previousPath === "/sent" ? 1 : 0);
      setEmail({
        id: data.id,
        header: data.header,
        body: data.body,
        createdAt: data.created_at,
        senderEmail: data.sender_email,
        senderImage: data.sender_image_path,
        senderName: data.sender_name,
        senderSurname: data.sender_surname,
        receiverList: data.receiver_list,
        is_anonymous: data.is_anonymous,
        is_favorite: data.is_favorite,
      });
    };

    loadEmail();
  }, [id]); // Handles both initial mount and reactive changes to props.id

  const handleAvatar = (event: React.MouseEvent<HTMLButtonElement>) => {
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

  const handleGetDrafts = () => {
    AppStorage.setCurrentView("drafts");
    navigate("/");
  };

  const handleGetSendEmail = () => {
    AppStorage.setCurrentView("sent");
    navigate("/sent");
  };

  const handleGoToMain = () => {
    AppStorage.setCurrentView("inbox");
    AppStorage.clearMailActionData();
    AppStorage.setCurrentFolderId(null);
    navigate("/");
  };

  const handleNewMail = () => {
    navigate("/send");
  };

  const handleBackToMail = () => {
    AppStorage.clearMailActionData();
    AppStorage.setCurrentFolderId(null);
    navigate("/");
  };

  const handleBackToSent = () => {
    AppStorage.clearMailActionData();
    AppStorage.setCurrentFolderId(null);
    navigate("/sent");
  };

  const loadEmailFromFolder = async (offset: number, folderID: number) => {
    AppStorage.setCurrentFolderId(folderID);
    AppStorage.setCurrentView("folder");
    navigate("/");
  };

  const handleFavoriteToggled = (newIsFavorite: boolean) => {
    setEmail((prev) => ({
      ...prev,
      is_favorite: newIsFavorite,
    }));
  };

  return (
    <div className="send-email-page" onClick={handleCloseModal}>
      <aside className="sidebar">
        <Sidebar
          isProfile={0}
          isPressProfile={0}
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
        <div className="mail-box-container">
          <ReadMail
            key={email.id}
            email={email}
            backToMail={handleBackToMail}
            backToSent={handleBackToSent}
            selectedFolderId={selectedFolderId}
            onFavoriteToggled={handleFavoriteToggled}
            navigate={navigate}
          />
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
}
