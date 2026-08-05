import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../../widgets/Sidebar/Sidebar"; // Adjust relative paths as needed
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import ReadMail from "../../widgets/ReadMail/ReadMail";
import ProfileModal from "../../widgets/ProfileModal/ProfileModal";
import { getEmailByID } from "../../api/ApiEmail";
import { useTranslation } from "../../hooks/useTranslation";
import { useMailStore } from "../../store/useMailStore";
import { useUIStore } from "../../store/useUIStore";
import { useComposerStore } from "../../store/useComposerStore";
import { selectAvatarUrl, useUserStore } from "../../store/useUserStore";

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

export default function ReadEmailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { t } = useTranslation();
  const { setCurrentView } = useUIStore();
  const clearComposerData = useComposerStore(
    (state) => state.clearComposerData,
  );
  const currentFolderId = useMailStore((state) => state.currentFolderId);
  const setCurrentFolderId = useMailStore((state) => state.setCurrentFolderId);
  const { name, surname, email: userEmail } = useUserStore();
  const avatarUrl = useUserStore(selectAvatarUrl);
  const { cacheSingleEmail } = useMailStore();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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

      cacheSingleEmail(data);

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

  const handleGoToMain = () => {
    setCurrentView("inbox");
    clearComposerData();
    setCurrentFolderId(null);
    navigate("/");
  };

  const handleNewMail = () => {
    navigate("/send");
  };

  const handleBackToMail = () => {
    clearComposerData();
    setCurrentFolderId(null);
    navigate("/");
  };

  const handleBackToSent = () => {
    clearComposerData();
    setCurrentFolderId(null);
    navigate("/sent");
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
          selectedFolderId={currentFolderId}
          name={name}
          surname={surname}
          email={userEmail}
          avatarUrl={avatarUrl}
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
              svg={avatarUrl}
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
            selectedFolderId={currentFolderId}
            onFavoriteToggled={handleFavoriteToggled}
          />
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
