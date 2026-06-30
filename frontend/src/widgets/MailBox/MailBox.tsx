import { AppStorage } from "../../utils/AppStorage";
import "./MailBox.scss";

const t = (key: string): string => {
  return AppStorage.t(key);
};

const trimEmailAddress = (email: string): string => {
  return email.substring(0, email.lastIndexOf("@"));
};

interface MailBoxProps {
  id: number;
  theme?: string;
  sender_name?: string;
  sender_surname?: string;
  sender_email?: string;
  receivers_emails?: Array<string>;
  title?: string;
  date: string;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSelect: (id: number, isChecked: boolean) => void;
  onToggleRead?: (id: number, isRead: boolean) => void;
  onToggleFavorite: (id: number, isChecked: boolean) => void;
  onTrash: (id: number) => void;
  isSelected: boolean;
  pageMain: boolean;
  isRead: boolean;
  currentView: string;
  isFavorite: boolean;
  isAnonymous: boolean;
  selectedFolderId?: number;
}

export default function MailBox({
  id,
  theme = "",
  sender_name = "",
  sender_surname = "",
  sender_email = "",
  receivers_emails = [],
  title = "",
  date,
  onClick,
  onSelect,
  onToggleRead,
  onToggleFavorite,
  onTrash,
  isSelected,
  pageMain,
  isRead,
  currentView,
  isFavorite,
  isAnonymous,
}: MailBoxProps) {
  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const isChecked = e.target.checked;

    if (onSelect) {
      onSelect(id, isChecked);
    }
  };

  const handleToggleRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (onToggleRead) {
      onToggleRead(id, !isRead);
    }
  };

  const handleFavorite = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleFavorite?.(id, e.target.checked);
  };

  const isMobile = window.innerWidth < 769;
  const isSentView = currentView === "sent";
  const isDraftsView = currentView === "drafts";
  const showSenderInfo = !isSentView && (sender_name || sender_email);
  const showFavoriteCheckbox = !isSentView && !isDraftsView;

  let sentToString = t("no_recipient");
  if (Array.isArray(receivers_emails) && receivers_emails.length > 0) {
    sentToString = "To: " + receivers_emails.join(", ");
  }

  return (
    <div
      className={`mail ${isSelected ? "selected" : ""} ${isRead ? "read" : ""} ${isFavorite ? "favorite" : ""}`}
      onClick={onClick}
    >
      <div className="checkbox-container">
        <input
          type="checkbox"
          className={`select-checkbox ${isSelected ? "selected" : ""}`}
          name="select-checkbox"
          checked={isSelected}
          onChange={handleSelect}
          onClick={(e: any) => e.stopPropagation()}
        />
        {showFavoriteCheckbox && (
          <input
            type="checkbox"
            className="favorites-checkbox"
            name="favorites-checkbox"
            checked={isFavorite}
            onChange={handleFavorite}
            onClick={(e: any) => e.stopPropagation()}
          />
        )}
      </div>
      <div className="mail-content">
        <div className="mail-content__left-part">
          <span className="mail-sender" title={t("from") + " " + sender_email}>
            {pageMain && (
              <input
                type="checkbox"
                name="read-checkbox"
                className={`read-checkbox ${isRead ? "read" : ""}`}
                checked={isRead}
                onChange={handleToggleRead}
                onClick={(e: any) => e.stopPropagation()}
              />
            )}
            {!pageMain && <div className="sent-checkbox"></div>}
            {isSentView || isDraftsView
              ? sentToString
              : showSenderInfo
                ? sender_name
                  ? `${sender_name} ${sender_surname || ""}`.trim()
                  : trimEmailAddress(sender_email)
                : isAnonymous
                  ? t("anonymous")
                  : t("no_recipient")}
          </span>
          {}
          {!isMobile ? (
            <div className="mail-text-content">
              <span className="mail-theme" data-mail-theme={id}>
                {theme !== "" ? theme : t("empty_subject")}
                <span className="mail-title"> - {title}</span>
              </span>
              <span className="mail-date">
                <span className="mail-date__text">{date}</span>
                <div className="mail-date__actions">
                  <div
                    className="action-btn action-btn--read"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      onToggleRead?.(id, !isRead);
                    }}
                    title={isRead ? t("mark_as_unread") : t("mark_as_read")}
                  />
                  <div
                    className="action-btn action-btn--trash"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      onTrash?.(id);
                    }}
                    title={t("trash")}
                  />
                </div>
              </span>
            </div>
          ) : (
            <div className="mail-text-content">
              <span className="mail-theme">
                {theme !== "" ? theme : t("empty_subject")}
              </span>
              <span className="mail-title">{title}</span>
              <span className="mail-date">{date}</span>
            </div>
          )}
        </div>
        <div className="mail-content__right-part-mobile">
          <span className="mail-date-mobile">{date}</span>
          {showFavoriteCheckbox && (
            <input
              className="favorites-checkbox-mobile"
              type="checkbox"
              name="favorites-checkbox"
              checked={isFavorite}
              onChange={handleFavorite}
              onClick={(e: any) => e.stopPropagation()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
