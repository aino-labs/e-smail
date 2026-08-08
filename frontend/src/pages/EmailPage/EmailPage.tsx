import { useNavigate } from "react-router-dom";
import MailHeader from "../../widgets/MailHeader/MailHeader";
import MailBox from "../../widgets/MailBox/MailBox";
import Button from "../../components/Button/Button";
import { formatTime } from "../../utils/date";
import { useTranslation, TranslationKey } from "../../hooks/useTranslation";
import { useEmailList } from "../../hooks/useEmailList";
import { ComposeIcon } from "@icons";
import "./EmailPage.scss";
import { useMailStore } from "../../store/useMailStore";

export default function EmailPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { folders } = useMailStore();

  const {
    config,
    currentFolderId,
    emails,
    isLoading,
    offset,
    total,
    selectedArray,
    isSelectAll,
    setOffset,
    loadEmails,
    toggleSelectEmail,
    toggleSelectAll,
    handleReadMail,
    handleDeleteSelected,
    handleToggleReadSingle,
    handleToggleFavoriteSingle,
    handleMarkAsRead,
    handleMoveToFolder,
    handleTrashSingle,
  } = useEmailList();

  const currentFolderName =
    folders.find((f) => f.id === currentFolderId) || null;

  const mobileHeaderTitle =
    config.view === "folder"
      ? currentFolderName?.name || t("folder")
      : t(config.view as TranslationKey);

  return (
    <div className="mail-page-content">
      {/* Mobile Title */}
      <div className="mail-box-container__mobile-header">
        <span>{mobileHeaderTitle}</span>
      </div>

      <div className="mail-box-container">
        <div className="container-form">
          {/* Action Toolbar */}
          <MailHeader
            onSelectAll={toggleSelectAll}
            isSelectAll={isSelectAll}
            reloadMail={() => loadEmails()}
            loadEmail={(newOffset) => setOffset(newOffset)}
            total={total}
            offset={offset}
            selectedCount={selectedArray.length}
            selectedEmails={selectedArray}
            onMarkAsRead={handleMarkAsRead}
            onMoveToFolder={handleMoveToFolder}
            onDelete={handleDeleteSelected}
            mainPage={config.view === "inbox"}
            currentView={config.view}
            emails={emails}
            isLoading={isLoading}
          />

          {/* Empty State Placeholder */}
          {!isLoading && emails.length === 0 && (
            <div className="mail-box-container-form__placeholder">
              <div className="mail-box-container-form__placeholder__icon" />
              <span>
                {t(config.emptyMessage as TranslationKey) || "No emails"}
              </span>
              {config.emptySubMessage && (
                <span>{t(config.emptySubMessage as TranslationKey)}</span>
              )}
            </div>
          )}

          {/* Email Item List */}
          {emails.length > 0 && (
            <div className="mail-box-container-form">
              {emails.map((email: any) => (
                <MailBox
                  key={`${email.id}-${email.is_starred}`}
                  id={email.id}
                  sender_name={email.sender_name || email.receivers_emails?.[0]}
                  sender_surname={email.sender_surname}
                  sender_email={
                    email.sender_email || email.receivers_emails?.[0]
                  }
                  receivers_emails={
                    config.view === "drafts"
                      ? email.receivers
                      : email.receivers_emails
                  }
                  theme={email.header}
                  title={email.body}
                  date={formatTime(email.created_at)}
                  isSelected={selectedArray.includes(email.id)}
                  onSelect={toggleSelectEmail}
                  isRead={email.is_read ?? true}
                  isFavorite={email.is_starred ?? false}
                  isAnonymous={email.is_anonymous}
                  pageMain={config.view === "inbox"}
                  currentView={config.view}
                  onClick={() => handleReadMail(email)}
                  onToggleRead={
                    config.showUnreadToggle
                      ? (id, isRead) => handleToggleReadSingle(id, isRead)
                      : undefined
                  }
                  onToggleFavorite={(id, isStarred) =>
                    handleToggleFavoriteSingle(id, isStarred)
                  }
                  onTrash={(id) => handleTrashSingle(id)}
                  selectedFolderId={currentFolderId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <Button
        className="button-new-letter-mobile"
        name="button-new-letter-mobile"
        icon={ComposeIcon}
        iconSize="28"
        onClick={(e) => {
          e.preventDefault();
          navigate("/send");
        }}
      />
    </div>
  );
}
