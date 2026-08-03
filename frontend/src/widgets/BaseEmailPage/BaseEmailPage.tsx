import { useState, useRef, useEffect, useLayoutEffect } from "react";
import Sidebar from "../../widgets/Sidebar/Sidebar";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import MailHeader from "../../widgets/MailHeader/MailHeader";
import MailBox from "../../widgets/MailBox/MailBox";
import { getProfile } from "../../api/ApiAuth";
import { readEmail, searchEmail, unReadEmail } from "../../api/ApiEmail";
import "./BaseEmailPage.scss";
import ProfileModal from "../../widgets/ProfileModal/ProfileModal";
import SupportModal from "../../widgets/SupportModal/SupportModal";
import { addEmailsInFolder, deleteEmailsFromFolder } from "../../api/ApiFolder";
import { deleteDraft } from "../../api/ApiDraft";
import { trash } from "../../api/ApiTrash";
import { sendFavorite, unFavorite } from "../../api/ApiFavorite";
import { formatTime } from "../../utils/date";
import { getDraftByID } from "../../api/ApiDraft";
import { TranslationKey, useTranslation } from "../../hooks/useTranslation";
import { useComposerStore } from "../../store/useComposerStore";
import { useUIStore } from "../../store/useUIStore";
import { useUserStore } from "../../store/useUserStore";
import { useMailStore } from "../../store/useMailStore";

interface BaseEmailProps {
  currentView: string;
  fetchEmails: (offset: number) => Promise<any>;
  deleteEmails?: (ids: number[]) => Promise<boolean>;
  onReadMail?: (email: any) => void;
  emptyMessage?: TranslationKey;
  emptySubMessage?: TranslationKey;
  showUnreadToggle?: boolean;
  showMarkAsRead?: boolean;
  showMoveToFolder?: boolean;
  currentFolderId?: number | null;
  currentFolderName?: string;
  navigate: (path: string) => void;
}

interface BaseEmailState {
  emails: Array<any>;
  isLoading: boolean;
  isModalOpen: boolean;
  isSelectAll: boolean;
  offset: number;
  selectedEmails: Set<number>;
  total: number;
}

export default function BaseEmailPage({
  currentView = "inbox",
  fetchEmails,
  emptyMessage = "empty_inbox",
  emptySubMessage,
  showUnreadToggle = false,
  showMarkAsRead = false,
  currentFolderId = null,
  currentFolderName = "",
  navigate,
}: BaseEmailProps) {
  const { t } = useTranslation();
  const { setCurrentView } = useUIStore();
  const {
    isProfileLoaded,
    setProfileData,
    name,
    surname,
    email,
    getAvatarUrl,
  } = useUserStore();
  const { cacheEmails, setCurrentFolderId } = useMailStore();
  const { clearComposerData, setComposerData } = useComposerStore();

  const lastFolderId = useRef<number | null>(null);
  const initialLoadDone = useRef<boolean>(false);

  const [state, setState] = useState<BaseEmailState>({
    emails: [],
    isLoading: true,
    isModalOpen: false,
    isSelectAll: false,
    offset: 0,
    selectedEmails: new Set<number>(),
    total: 0,
  });
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  const offsetRef = useRef(state.offset);
  useEffect(() => {
    offsetRef.current = state.offset;
  }, [state.offset]);

  const updateState = (partial: Partial<BaseEmailState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  };

  // --- Lifecycle ---

  useLayoutEffect(() => {
    setCurrentView(currentView);
  }, [currentView]);

  useLayoutEffect(() => {
    if (!isProfileLoaded) {
      loadProfile();
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && initialLoadDone.current) {
        loadEmails(offsetRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    loadEmails(0);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useLayoutEffect(() => {
    if (currentView === "folder" && currentFolderId !== lastFolderId.current) {
      lastFolderId.current = currentFolderId;
      loadEmails(0);
    }
  }, [currentView, currentFolderId]);

  // --- Core Methods ---

  const getSelectedArray = (): number[] => {
    return Array.from(state.selectedEmails);
  };

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      if (data === null) {
        navigate("/login");
      } else {
        setProfileData(data);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      navigate("/login");
    }
  };

  const loadEmails = async (offset: number) => {
    if (!isProfileLoaded) {
      return;
    }

    updateState({ isLoading: true });

    if (!fetchEmails) {
      console.warn("fetchEmails prop is missing in BaseEmailPage");
      updateState({ isLoading: false });
      return;
    }

    try {
      const data = await fetchEmails(offset);
      const fetchedEmails = data.emails || data.drafts || data || [];
      const list = Array.isArray(fetchedEmails) ? fetchedEmails : [];

      cacheEmails(list);

      updateState({
        emails: list,
        isLoading: false,
        total: data.total || list.length,
        offset: offset,
        selectedEmails: new Set<number>(),
        isSelectAll: false,
      });
    } catch (error) {
      console.error(`Failed to load ${currentView}:`, error);
      updateState({ isLoading: false });
    } finally {
      initialLoadDone.current = true;
    }
  };

  const handleAvatar = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    updateState({ isModalOpen: true });
  };

  const handleCloseModal = () => {
    updateState({ isModalOpen: false });
  };

  const handleProfileClick = () => {
    updateState({ isModalOpen: false });
    navigate("/profile/personal");
  };

  const handleSettingsClick = () => {
    updateState({ isModalOpen: false });
    navigate("/profile/interface");
  };

  const handleNewMail = () => {
    navigate("/send");
  };

  const handleReadMail = async (email: any) => {
    if (currentView === "drafts") {
      try {
        const response = await getDraftByID(email.id);
        if (response) {
          const draft = await response.json();
          setComposerData({
            type: "draft",
            draftId: draft.id,
            subject: draft.header,
            body: draft.body,
            recipients: draft.receivers || [],
          });
          navigate("/send");
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
      return;
    }

    await readEmail([email.id]);

    if (currentView === "folder") {
      setCurrentFolderId(currentFolderId);
      setCurrentView("folder");
    }

    navigate(`/read/${email.id}`);
  };

  const handleTrashSingle = async (emailId: number) => {
    let success = false;
    if (currentView === "drafts") {
      success = await deleteDraft([emailId]);
    } else if (currentView === "folder" && currentFolderId !== null) {
      success = await deleteEmailsFromFolder(currentFolderId, [emailId]);
    } else {
      success = await trash([emailId]);
    }

    if (success) {
      await loadEmails(state.offset);
    }
  };

  const handleDeleteSelected = async () => {
    if (state.selectedEmails.size === 0) return;

    try {
      let success = false;
      const selectedArray = getSelectedArray();

      if (currentView === "drafts") {
        success = await deleteDraft(selectedArray);
      } else if (currentView === "folder" && currentFolderId !== null) {
        success = await deleteEmailsFromFolder(currentFolderId, selectedArray);
      } else {
        success = await trash(selectedArray);
      }

      if (success) {
        await loadEmails(state.offset);
        updateState({
          selectedEmails: new Set<number>(),
          isSelectAll: false,
        });
      }
    } catch (error) {
      console.error("Error deleting emails:", error);
    }
  };

  const handleToggleReadSingle = async (
    emailId: number,
    newReadState: boolean,
  ) => {
    if (!showUnreadToggle) return;

    try {
      if (newReadState) {
        await readEmail([emailId]);
      } else {
        await unReadEmail([emailId]);
      }

      const updatedEmails = state.emails.map((email: any) =>
        email.id === emailId ? { ...email, is_read: newReadState } : email,
      );

      updateState({ emails: updatedEmails });
    } catch (error) {
      console.error("Error toggling read status:", error);
    }
  };

  const handleToggleFavoriteSingle = async (
    emailId: number,
    newState: boolean,
  ) => {
    try {
      if (newState) {
        await sendFavorite([emailId]);
      } else {
        await unFavorite([emailId]);
      }

      const updatedEmails = state.emails.map((email: any) =>
        email.id === emailId ? { ...email, is_starred: newState } : email,
      );

      updateState({ emails: updatedEmails });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleMarkAsRead = async () => {
    if (!showMarkAsRead) return;

    const unreadIds = getSelectedArray().filter((selectedId: number) => {
      const email = state.emails.find((e: any) => e.id === selectedId);
      return email && !email.is_read;
    });

    if (unreadIds.length > 0) {
      await readEmail(unreadIds);
      const updatedEmails = state.emails.map((email: any) =>
        unreadIds.includes(email.id) ? { ...email, is_read: true } : email,
      );

      updateState({ emails: updatedEmails });
    }
  };

  const handleSelectEmail = (emailId: number) => {
    const newSet = new Set<number>(state.selectedEmails);

    if (newSet.has(emailId)) {
      newSet.delete(emailId);
    } else {
      newSet.add(emailId);
    }

    const allSelected =
      state.emails.length > 0 && newSet.size === state.emails.length;

    updateState({
      selectedEmails: newSet,
      isSelectAll: allSelected,
    });
  };

  const handleSelectAll = (isChecked?: boolean) => {
    if (isChecked) {
      const allIds = new Set<number>(state.emails.map((e: any) => e.id));
      updateState({
        isSelectAll: true,
        selectedEmails: allIds,
      });
    } else {
      updateState({
        isSelectAll: false,
        selectedEmails: new Set<number>(),
      });
    }
  };

  const hasUnreadSelected = () => {
    return getSelectedArray().some((selectedId: number) => {
      const email = state.emails.find((e: any) => e.id === selectedId);
      return email && !email.is_read;
    });
  };

  const handleGoToMain = () => {
    if (currentView === "inbox") return;
    setCurrentView("inbox");
    clearComposerData();
    setCurrentFolderId(null);
    navigate("/");
  };

  const handleSearch = async (data: string) => {
    if (!data || data.trim() === "") return;
    try {
      await searchEmail(data);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const toggleSidebar = () => {
    const sidebar = document.querySelector(".sidebar");
    const sidebarOverlay = document.querySelector(".sidebar-overlay");
    sidebar?.classList.toggle("open");
    sidebarOverlay?.classList.toggle("open");
  };

  const handleMoveToFolder = async (folderId: number) => {
    if (state.selectedEmails.size === 0 || !folderId) return;

    try {
      await addEmailsInFolder(folderId, getSelectedArray());
      await loadEmails(state.offset);
      updateState({
        selectedEmails: new Set<number>(),
        isSelectAll: false,
      });
    } catch (error) {
      console.error("Error moving emails to folder:", error);
    }
  };

  // --- Render Layout Setup ---
  const selectedArray = getSelectedArray();
  const mobileHeaderTitle =
    currentView === "folder"
      ? currentFolderName
      : t(currentView as TranslationKey);

  return (
    <div className="main-page" onClick={handleCloseModal}>
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
      <div className="sidebar-overlay" onClick={toggleSidebar}></div>

      <aside className="sidebar">
        <Sidebar
          isProfile={0}
          name={name}
          surname={surname}
          avatarUrl={getAvatarUrl()}
          email={email}
          newMail={handleNewMail}
          backToMail={handleGoToMain}
          selectedFolderId={currentFolderId}
          navigate={navigate}
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
            <div className="support" onClick={() => setIsSupportOpen(true)} />
            <Button
              svg={getAvatarUrl()}
              name="avatar"
              help="Аккаунт"
              onClick={handleAvatar}
            />
          </div>
        </div>

        <div className="mail-box-container__mobile-header">
          <span>{mobileHeaderTitle}</span>
        </div>

        <div className="mail-box-container">
          <div className="container-form">
            <MailHeader
              onSelectAll={handleSelectAll}
              isSelectAll={state.isSelectAll}
              reloadMail={() => loadEmails(state.offset)}
              loadEmail={loadEmails}
              total={state.total}
              offset={state.offset}
              selectedCount={selectedArray.length}
              selectedEmails={selectedArray}
              onMarkAsRead={handleMarkAsRead}
              onMoveToFolder={handleMoveToFolder}
              onDelete={handleDeleteSelected}
              mainPage={currentView === "inbox"}
              currentView={currentView}
              emails={state.emails}
              isLoading={state.isLoading}
            />

            {state.emails.length === 0 && (
              <div className="mail-box-container-form__placeholder">
                <div className="mail-box-container-form__placeholder__icon"></div>
                <span>{t(emptyMessage) || "Нет писем"}</span>
                {emptySubMessage
                  ? t(emptySubMessage) && <span>{t(emptySubMessage)}</span>
                  : null}
              </div>
            )}

            {state.emails.length !== 0 && (
              <div className="mail-box-container-form">
                {state.emails.map((email: any) => (
                  <MailBox
                    key={`${email.id}-${email.is_starred}`}
                    id={email.id}
                    sender_name={
                      email.sender_name || email.receivers_emails?.[0]
                    }
                    sender_surname={email.sender_surname}
                    sender_email={
                      email.sender_email || email.receivers_emails?.[0]
                    }
                    receivers_emails={
                      currentView === "drafts"
                        ? email.receivers
                        : email.receivers_emails
                    }
                    theme={email.header}
                    title={email.body}
                    date={formatTime(email.created_at)}
                    isSelected={selectedArray.includes(email.id)}
                    onSelect={handleSelectEmail}
                    isRead={email.is_read !== undefined ? email.is_read : true}
                    isFavorite={
                      email.is_starred !== undefined ? email.is_starred : false
                    }
                    isAnonymous={email.is_anonymous}
                    pageMain={currentView === "inbox"}
                    currentView={currentView}
                    onClick={() => handleReadMail(email)}
                    onToggleRead={
                      showUnreadToggle ? handleToggleReadSingle : undefined
                    }
                    onToggleFavorite={handleToggleFavoriteSingle}
                    onTrash={handleTrashSingle}
                    selectedFolderId={currentFolderId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <ProfileModal
          isOpen={state.isModalOpen}
          onClose={handleCloseModal}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          navigate={navigate}
        />
      </div>

      <Button
        className="button-new-letter-mobile"
        name="button-new-letter-mobile"
        svg="../../assets/svg/Compose.svg"
        onClick={(event: React.MouseEvent) => {
          event.preventDefault();
          handleNewMail();
        }}
      />
    </div>
  );
}
