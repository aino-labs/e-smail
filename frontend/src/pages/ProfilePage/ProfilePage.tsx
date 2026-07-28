import React, { useState, useEffect, useRef } from "react";
import "./ProfilePage.scss";
import Sidebar from "../../widgets/Sidebar/Sidebar";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import UploadAvatar from "../../components/UploadAvatar/UploadAvatar";
import { validation } from "../../utils/validation";
import { changePassword, getProfile, changeProfile } from "../../api/ApiAuth";
import { getMyTickets, getMessages, answerTicket } from "../../api/ApiSupport";
import { AppStorage } from "../../store/AppStorage";
import FolderChange from "../../widgets/FolderChange/FolderChange";
import SupportModal from "../../widgets/SupportModal/SupportModal";
import SelectDate from "../../components/SelectDate/SelectDate";
import { requestNotificationPermission } from "../../utils/emailNotifications";
import { toast } from "../../store/toastStore";
import { useTranslation } from "../../hooks/useTranslation";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useUserStore } from "../../store/useUserStore";

type ProfileTabId = 0 | 1 | 2 | 3 | 4;

interface ProfilePageProps {
  navigate: (route: string, replace?: boolean) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ navigate }) => {
  const { t } = useTranslation();

  const {
    theme,
    setTheme,
    language,
    setLanguage,
    notificationsEnabled,
    setNotificationsEnabled,
    anonymousEnabled,
    setAnonymousEnabled,
  } = useSettingsStore();

  const shouldOpenSettings = AppStorage.getOpenSettingsOnProfile();

  // State Declarations
  const [profileState, setProfileState] = useState<ProfileTabId>(
    shouldOpenSettings ? 2 : 0,
  );
  const {
    name,
    surname,
    email,
    is_male,
    birthDay,
    birthMonth,
    birthYear,
    setProfileData,
    image_path,
    setImagePath,
  } = useUserStore();

  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [avatarKey, setAvatarKey] = useState<number>(0);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [isFolderEditMode, setIsFolderEditMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);

  // Support section state
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInputText, setChatInputText] = useState<string>("");
  const [showNewTicketForm, setShowNewTicketForm] = useState<boolean>(false);
  const [newTicketSubject, setNewTicketSubject] = useState<string>("");
  const [newTicketMessage, setNewTicketMessage] = useState<string>("");
  const [mobileChatOpen, setMobileChatOpen] = useState<boolean>(false);

  // Keep a mutable ref of selectedTicketId for the polling interval closure
  const selectedTicketIdRef = useRef<number | null>(null);
  useEffect(() => {
    selectedTicketIdRef.current = selectedTicketId;
  }, [selectedTicketId]);

  const isMobile = window.innerWidth < 769;

  // Sync tab layout based on current URL path
  const syncTabFromUrl = () => {
    const match = window.location.pathname.match(/\/profile\/(.+)$/);
    if (!match) {
      if (window.location.pathname === "/profile") {
        setProfileState(0);
      }
      return;
    }

    const tabRoutes: Record<string, ProfileTabId> = {
      personal: 0,
      password: 1,
      interface: 2,
      folders: 3,
      support: 4,
    };

    setProfileState(tabRoutes[match[1]] ?? 0);
  };

  // Fetch profiles on component mount
  const loadProfile = async () => {
    const data = await getProfile();
    if (!data) {
      navigate("/login");
      return;
    }

    let bDay = "";
    let bMonth = "";
    let bYear = "";

    if (data.birthdate && typeof data.birthdate === "string") {
      const parts = data.birthdate.split("T")[0].split("-");
      if (parts.length === 3) {
        bYear = parts[0];
        bMonth = String(parseInt(parts[1], 10));
        bDay = String(parseInt(parts[2], 10));
      }
    }

    setProfileData({
      is_male: data.is_male ?? true,
      name: data.name || "",
      surname: data.surname || "",
      email: data.email || "",
      image_path: data.image_path || "",
      birthDay: bDay,
      birthMonth: bMonth,
      birthYear: bYear,
      anonymousEnabled: data.accept_anonymous,
    });
  };

  // Setup synchronization hooks and event listeners
  useEffect(() => {
    loadProfile();
    syncTabFromUrl();

    window.addEventListener("popstate", syncTabFromUrl);

    return () => {
      window.removeEventListener("popstate", syncTabFromUrl);
    };
  }, []);

  // Polling management for Support Tab
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const fetchSupportTickets = async () => {
      const tickets = await getMyTickets();
      setSupportTickets(tickets || []);
    };

    const fetchTicketMessages = async (ticketId: number) => {
      const messages = await getMessages(ticketId);
      setChatMessages(messages || []);
    };

    if (profileState === 4) {
      fetchSupportTickets();
      pollingInterval = setInterval(() => {
        fetchSupportTickets();
        if (selectedTicketIdRef.current !== null) {
          fetchTicketMessages(selectedTicketIdRef.current);
        }
      }, 10000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [profileState]);

  // Support logic actions
  const fetchTicketMessagesDirect = async (ticketId: number) => {
    const messages = await getMessages(ticketId);
    setChatMessages(messages || []);
  };

  const handleSelectTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setMobileChatOpen(true);
    fetchTicketMessagesDirect(ticketId);
  };

  // Validation routines
  const validateField = (field: string, value: string) => {
    const data = {
      email: field === "email" ? value : email,
      newPassword: field === "newPassword" ? value : newPassword,
      oldPassword: field === "oldPassword" ? value : oldPassword,
      name: field === "name" ? value : name,
      surname: field === "surname" ? value : surname,
    };

    const result = validation(data, t);
    if (!result.isValid) {
      const fieldError = result.errors.find((err: any) => err.field === field);
      if (fieldError) return fieldError.message;
    }
    return undefined;
  };

  const handleInputChange = (field: string, value: string) => {
    const error = validateField(field, value);

    if (field === "name") setProfileData({ name: value });
    if (field === "surname") setProfileData({ surname: value });
    if (field === "oldPassword") setOldPassword(value);
    if (field === "newPassword") setNewPassword(value);

    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const shouldShowSuccess = (field: string): boolean => {
    const stateMapping: Record<string, string> = {
      name,
      surname,
      oldPassword,
      newPassword,
    };
    return !!(touched[field] && stateMapping[field] && !errors[field]);
  };

  const handleAvatarUpdate = () => {
    setAvatarKey((prev) => prev + 1);
    toast.show("saved_successfully", "success");
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      if (response) {
        setOldPassword("");
        setNewPassword("");

        toast.show("saved_successfully", "success");
      } else {
        toast.show("passwords_dont_match", "error");
      }
    } catch {
      toast.show("client_error", "error");
    }
  };

  const handleChangeProfileData = async (event: React.FormEvent) => {
    event.preventDefault();
    let birthDate = null;

    if (
      birthYear?.length > 0 &&
      birthMonth?.length > 0 &&
      birthDay?.length > 0
    ) {
      const month = birthMonth.padStart(2, "0");
      const day = birthDay.padStart(2, "0");
      birthDate = `${birthYear}-${month}-${day}T00:00:00Z`;
    }

    try {
      const payload: any = { name, surname, is_male, email };
      if (birthDate) payload.birthdate = birthDate;

      const response = await changeProfile(payload);
      if (response) {
        AppStorage.setProfileData({
          name,
          surname,
          email,
          is_male,
          image_path,
          birthDay,
          birthMonth,
          birthYear,
          anonymousEnabled,
        });
        toast.show("saved_successfully", "success");
      } else {
        toast.show("client_error", "error");
      }
    } catch (error) {
      console.error("Profile change error:", error);
    }
  };

  const navigateToTab = (tabId: ProfileTabId, route: string) => {
    setProfileState(tabId);
    navigate(route, true);
  };

  const handleToggleFolderEditMode = async () => {
    if (isFolderEditMode && AppStorage.folderChangeInstance) {
      await AppStorage.folderChangeInstance.saveAllPendingChanges();
    }
    setIsFolderEditMode((prev) => !prev);
  };

  const handleEnableNotifs = () => {
    setNotificationsEnabled(true);
    requestNotificationPermission();
    toast.show(t("notifications_enabled"), "success");
  };

  const handleDisableNotifs = () => {
    setNotificationsEnabled(false);
    toast.show(t("notifications_disabled"), "success");
  };

  const toggleAnonymousMode = async (enabled: boolean) => {
    await changeProfile({
      name,
      surname,
      is_male: is_male ? "true" : "false",
      accept_anonymous: enabled,
    });
    setAnonymousEnabled(enabled);
    toast.show(
      enabled ? t("anonymous_enabled") : t("anonymous_disabled"),
      "success",
    );
  };

  const handleSupport = () => {
    document.querySelector(".support-modal")?.classList.toggle("show");
  };

  const handleSendMessage = async () => {
    if (!selectedTicketId || !chatInputText.trim()) return;

    const resp = await answerTicket(selectedTicketId, chatInputText);
    if (resp) {
      setChatInputText("");
      setChatMessages((prev) => [...prev, resp]);
    }
  };

  const handleCreateTicket = () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;

    const newTicket = {
      id: Date.now(),
      subject: newTicketSubject,
      status: "open",
      lastMessagePreview:
        newTicketMessage.slice(0, 50) +
        (newTicketMessage.length > 50 ? "..." : ""),
    };

    const initialMsg = {
      id: Date.now(),
      text: newTicketMessage,
      timestamp: new Date().toISOString(),
      is_admin: false,
    };

    setSupportTickets((prev) => [...prev, newTicket]);
    setShowNewTicketForm(false);
    setNewTicketSubject("");
    setNewTicketMessage("");
    setSelectedTicketId(newTicket.id);
    setChatMessages([initialMsg]);
  };

  // Sub-renderers to keep code scannable
  const renderPersonalTab = () => (
    <div className="profile-container">
      {isMobile && (
        <div
          className="settings-back-to-menu-button-mobile"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div className="arrow-left-icon" />
          <span>{t("profile")}</span>
        </div>
      )}
      <h1>{t("personal_information")}</h1>
      <div className="profile-content">
        <div className="profile-avatar">
          <UploadAvatar
            image={image_path}
            onAvatarUpdate={handleAvatarUpdate}
            key={avatarKey}
          />
        </div>
        <form className="profile-form" onSubmit={handleChangeProfileData}>
          <Input
            type="text"
            placeholder={t("enter_name")}
            input_title={t("name")}
            name="name"
            value={name}
            success={shouldShowSuccess("name")}
            error={errors.name}
            onInput={(e: any) => handleInputChange("name", e.target.value)}
          />
          <Input
            type="text"
            placeholder={t("enter_surname")}
            input_title={t("surname")}
            name="surname"
            value={surname}
            success={shouldShowSuccess("surname")}
            error={errors.surname}
            onInput={(e: any) => handleInputChange("surname", e.target.value)}
          />
          <SelectDate
            onChange={(date) => {
              setProfileData({
                birthDay: date.day,
                birthMonth: date.month,
                birthYear: date.year,
              });
            }}
            birthDay={birthDay}
            birthMonth={birthMonth}
            birthYear={birthYear}
          />
          <div className="profile__checkbox">
            <span>{t("gender")}</span>
            <div className="checkbox-actions">
              <div className="checkbox-form">
                <Input
                  id="male"
                  type="radio"
                  name="radio-gender"
                  checked={is_male}
                  onInput={() => setProfileData({ is_male: true })}
                />
                <label htmlFor="male">{t("male")}</label>
              </div>
              <div className="checkbox-form">
                <Input
                  id="female"
                  type="radio"
                  name="radio-gender"
                  checked={!is_male}
                  onInput={() => setProfileData({ is_male: false })}
                />
                <label htmlFor="female">{t("female")}</label>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            <Button title={t("save")} name="change-profile" type="submit" />
            {!isMobile && (
              <Button
                title={t("back")}
                name="back-to-mail"
                onClick={() => navigate("/")}
              />
            )}
          </div>
        </form>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="profile-security">
      {isMobile && (
        <div
          className="settings-back-to-menu-button-mobile"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div className="arrow-left-icon" />
          <span>{t("profile")}</span>
        </div>
      )}
      <h1>{t("security")}</h1>
      <div className="profile-content">
        <form className="profile-form" onSubmit={handleChangePassword}>
          <Input
            type="password"
            placeholder={t("enter_password")}
            input_title={t("oldpassword")}
            name="oldPassword"
            error={errors.oldPassword}
            value={oldPassword}
            onInput={(e: any) =>
              handleInputChange("oldPassword", e.target.value)
            }
          />
          <Input
            type="password"
            placeholder={t("enter_password")}
            input_title={t("newpassword")}
            name="newPassword"
            error={errors.newPassword}
            value={newPassword}
            onInput={(e: any) =>
              handleInputChange("newPassword", e.target.value)
            }
          />
          <div className="profile-actions">
            <Button title={t("save")} name="change-password" type="submit" />
            {!isMobile && (
              <Button
                title={t("back")}
                name="back-to-mail"
                onClick={() => navigate("/")}
              />
            )}
          </div>
        </form>
      </div>
    </div>
  );

  const renderInterfaceTab = () => (
    <div className="profile-security">
      {isMobile && (
        <div
          className="settings-back-to-menu-button-mobile"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div className="arrow-left-icon" />
          <span>{t("profile")}</span>
        </div>
      )}
      <h1>{t("settings")}</h1>
      <div className="profile-content">
        <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
          <div className="profile__checkbox">
            <span>{t("theme")}</span>
            <div className="checkbox-actions">
              <div className="checkbox-form">
                <Input
                  id="dark"
                  type="radio"
                  name="radio-theme"
                  checked={theme === "dark"}
                  onChange={() => setTheme("dark")}
                />
                <label htmlFor="dark">{t("dark_theme")}</label>
              </div>
              <div className="checkbox-form">
                <Input
                  id="light"
                  type="radio"
                  name="radio-theme"
                  checked={theme === "light"}
                  onChange={() => setTheme("light")}
                />
                <label htmlFor="light">{t("light_theme")}</label>
              </div>
            </div>
          </div>
          <div className="profile__checkbox">
            <span>{t("interface_language")}</span>
            <div className="checkbox-actions">
              <div className="checkbox-form">
                <Input
                  id="ru"
                  type="radio"
                  name="radio-language"
                  checked={language === "ru"}
                  onChange={() => setLanguage("ru")}
                />
                <label htmlFor="ru">{t("russian")}</label>
              </div>
              <div className="checkbox-form">
                <Input
                  id="en"
                  type="radio"
                  name="radio-language"
                  checked={language === "en"}
                  onChange={() => setLanguage("en")}
                />
                <label htmlFor="en">{t("english")}</label>
              </div>
            </div>
          </div>
          <div className="profile__checkbox">
            <span>{t("notifications")}</span>
            <div className="checkbox-actions">
              <div className="checkbox-form">
                <Input
                  id="notif-on"
                  type="radio"
                  name="radio-notifications"
                  checked={notificationsEnabled}
                  onChange={handleEnableNotifs}
                />
                <label htmlFor="notif-on">{t("on")}</label>
              </div>
              <div className="checkbox-form">
                <Input
                  id="notif-off"
                  type="radio"
                  name="radio-notifications"
                  checked={!notificationsEnabled}
                  onChange={handleDisableNotifs}
                />
                <label htmlFor="notif-off">{t("off")}</label>
              </div>
            </div>
          </div>
          <div className="profile__checkbox">
            <span>{t("enable_anonymous")}</span>
            <div className="checkbox-actions">
              <div className="checkbox-form">
                <Input
                  id="anon-on"
                  type="radio"
                  name="radio-anonymous"
                  checked={anonymousEnabled === true}
                  onChange={() => toggleAnonymousMode(true)}
                />
                <label htmlFor="anon-on">{t("allow")}</label>
              </div>
              <div className="checkbox-form">
                <Input
                  id="anon-off"
                  type="radio"
                  name="radio-anonymous"
                  checked={anonymousEnabled === false}
                  onChange={() => toggleAnonymousMode(false)}
                />
                <label htmlFor="anon-off">{t("not_allow")}</label>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  const renderFoldersTab = () => (
    <div className="profile-folder">
      {isMobile && (
        <div
          className="settings-back-to-menu-button-mobile"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div className="arrow-left-icon" />
          <span>{t("profile")}</span>
        </div>
      )}
      <h1>{t("folder")}</h1>
      <div className="profile-content">
        <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
          <FolderChange isEditMode={isFolderEditMode} />
        </form>
      </div>
    </div>
  );

  const renderSupportTab = () => (
    <div className="profile-support">
      {isMobile && (
        <div
          className="settings-back-to-menu-button-mobile"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div className="arrow-left-icon" />
          <span>{t("profile")}</span>
        </div>
      )}
      <div
        className={`support-wrapper ${isMobile ? "mobile" : ""} ${mobileChatOpen ? "chat-open" : ""}`}
      >
        <div className="support-container">
          <div className="support-tickets-panel">
            <div className="support-tickets-header">
              <h2>Поддержка</h2>
              <Button
                svg="../../assets/svg/Compose.svg"
                className="small-text"
                name="new-ticket"
                onClick={handleSupport}
              />
            </div>

            <div className="tickets-list">
              {supportTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`ticket-item ${selectedTicketId === ticket.id ? "active" : ""}`}
                  onClick={() => handleSelectTicket(ticket.id)}
                >
                  <div className="ticket-subject">{ticket.subject}</div>
                  <div className="ticket-preview">
                    {ticket.lastMessagePreview}
                  </div>
                </div>
              ))}
            </div>

            {showNewTicketForm && (
              <div className="new-ticket-form">
                <Input
                  type="text"
                  placeholder="Subject"
                  value={newTicketSubject}
                  onInput={(e: any) => setNewTicketSubject(e.target.value)}
                />
                <textarea
                  placeholder="Describe your issue..."
                  value={newTicketMessage}
                  onChange={(e: any) => setNewTicketMessage(e.target.value)}
                  rows={4}
                />
                <div className="form-actions">
                  <Button
                    title="Create"
                    name="create-ticket"
                    onClick={handleCreateTicket}
                  />
                  <Button
                    title="Cancel"
                    name="cancel-ticket"
                    onClick={() => setShowNewTicketForm(false)}
                  />
                </div>
              </div>
            )}
          </div>

          {(selectedTicketId || !isMobile) && (
            <div className="support-chat-panel">
              {isMobile && (
                <button
                  className="back-button"
                  onClick={() => {
                    setSelectedTicketId(null);
                    setMobileChatOpen(false);
                  }}
                >
                  &larr; Назад
                </button>
              )}
              <div className="chat-messages">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message ${msg.is_admin ? "admin" : "user"}`}
                  >
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>
              <div className="chat-input-wrapper">
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder="Type a message..."
                />
                <Button
                  title="Send"
                  name="send-message"
                  onClick={handleSendMessage}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="profile-page">
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
      <aside className={`sidebar ${isMobile || isSidebarOpen ? "open" : ""}`}>
        <Sidebar
          isProfile={1}
          isPressProfile={profileState}
          avatarUrl={image_path}
          name={name}
          surname={surname}
          email={email}
          backToMail={() => navigate("/")}
          changeProfile={() => navigateToTab(0, "/profile/personal")}
          changePassword={() => navigateToTab(1, "/profile/password")}
          handleSetting={() => navigateToTab(2, "/profile/interface")}
          handleFolder={() => navigateToTab(3, "/profile/folders")}
          handleSupport={() => navigateToTab(4, "/profile/support")}
          newMail={() => {}}
          navigate={navigate}
        />
      </aside>

      <div className="right-part">
        {!isMobile && (
          <div className="top-bar">
            <div className="search-bar" />
          </div>
        )}
        <div className="profile-content-area">
          {profileState === 0 && renderPersonalTab()}
          {profileState === 1 && renderSecurityTab()}
          {profileState === 2 && renderInterfaceTab()}
          {profileState === 3 && renderFoldersTab()}
          {profileState === 4 && renderSupportTab()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
