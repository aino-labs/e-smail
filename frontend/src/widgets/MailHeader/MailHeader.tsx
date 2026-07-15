import { useState } from 'react';
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import "./MailHeader.scss";
import { AppStorage } from "../../stores/AppStorage";
import { getEmailsSpam, sendSpam, unSpam } from "../../api/ApiSpam";
import { sendFavorite, unFavorite } from "../../api/ApiFavorite";
import { getEmailsTrash, untrash } from "../../api/ApiTrash";
import { readEmail, unReadEmail } from "../../api/ApiEmail";

interface MailHeaderProps {
  onSelectAll?: (isChecked: boolean) => void;
  loadEmail: (offset: number) => void;
  onMoveToFolder?: (folderId: number) => void;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
  reloadMail?: () => void;
  offset: number;
  total: number;
  currentView: string;
  emails: Array<any>;
  selectedEmails: Array<number>;
  mainPage: boolean;
  selectedCount: number;
  isSelectAll: boolean;
  isLoading: boolean;
}

const t = (key: string): string => {
  return AppStorage.t(key);
}

export default function MailHeader({
  onSelectAll,
  loadEmail,
  onMoveToFolder,
  onMarkAsRead,
  onDelete,
  reloadMail,
  offset = 0,
  total = 0,
  currentView = "",
  selectedEmails = [],
  emails = [],
  mainPage = false,
  selectedCount = 0,
  isSelectAll = false,
  isLoading = false
}: MailHeaderProps) {
  const [showFolderList, setShowFolderList] = useState<boolean>(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e && e.target ? e.target.checked : false;
    onSelectAll?.(isChecked);
  };

  const handlePrevPage = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const newOffset = Math.max(0, offset - 50);
    loadEmail(newOffset);
  };

  const handleNextPage = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const newOffset = offset + 50;
    if (newOffset < total) {
      loadEmail(newOffset);
    }
  };

  const handleMoveToFolder = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setShowFolderList(!showFolderList);
  };

  const handleFolderSelect = (folderId: number, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setShowFolderList(false);
    onMoveToFolder?.(folderId);
  };

  const handleMarkAsSpam = async (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (selectedEmails && selectedEmails.length > 0) {
      await sendSpam(selectedEmails);
      reloadMail?.();
    }
  };

  const handleMarkAsFavorite = async (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (selectedEmails && selectedEmails.length > 0) {
      await sendFavorite(selectedEmails);
      reloadMail?.();
    }
  };

  const handleUnMarkAsFavorite = async (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (selectedEmails && selectedEmails.length > 0) {
      await unFavorite(selectedEmails);
      reloadMail?.();
    }
  };

  const handleMarkAsRead = async (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (selectedEmails && selectedEmails.length > 0) {
      await readEmail(selectedEmails);
      onMarkAsRead?.();
      reloadMail?.();
    }
  };

  const handleMarkAsUnread = async (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (selectedEmails && selectedEmails.length > 0) {
      await unReadEmail(selectedEmails);
      reloadMail?.();
    }
  };

  const handleMoveToInbox = async (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (selectedEmails && selectedEmails.length > 0) {

      if (currentView === "trash") {
        await untrash(selectedEmails);
        await getEmailsTrash(0);
      } else if (currentView === "spam") {
        await unSpam(selectedEmails);
        await getEmailsSpam(0);
      }
      reloadMail?.();
    }
  };

  const hasReadSelected = () => {
    if (!selectedEmails) return false;
    if (!emails) return false;
    return selectedEmails.some((selectedId: number) => {
      const email = emails.find((e: any) => e.id === selectedId);
      return email && email.is_read;
    });
  };

  const hasFavoriteSelected = () => {
    if (!selectedEmails) return false;
    if (!emails) return false;
    return selectedEmails.some((selectedId: number) => {
      const email = emails.find((e: any) => e.id === selectedId);
      return email && email.is_favorite;
    });
  };

  const startItem = total > 0 ? offset + 1 : 0;
  const endItem = Math.min(offset + 50, total);
  const hasSelected = selectedCount > 0;
  const isSpamOrTrash = currentView === "spam" || currentView === "trash";
  const isDrafts = currentView === "drafts";
  const isMobile = window.innerWidth < 769;
  const isSent = currentView === "sent";
  const hasOnlyUnread = hasSelected && !hasReadSelected();

  const folders = AppStorage.folders || [];

  return (
    <div className="mail-header">
      <div className="mail-header__left-container">
        <div className="left-container__select-all">
          <Input
            type="checkbox"
            className={`checkbox-all ${isSelectAll ? "isSelect" : ""}`}
            name="checkbox-all"
            checked={isSelectAll}
            onChange={handleSelectAll}
          />
          <Button
            name="arrow-down"
            help="Выбрать"
            onClick={(event: any) => {
              event.preventDefault();
            }}
          />
        </div>

        {!hasSelected && (
          <Button
            name="refresh"
            className={isLoading ? "refreshing" : ""}
            block={isLoading}
            help={t("refresh")}
            onClick={(event: any) => {
              event.preventDefault();
              reloadMail?.();
            }}
          />
        )}

        {hasSelected && (
          <div className="select-all-container">
            <div
              className={`select-all__tools-left${isDrafts || isSent || isSpamOrTrash ? " hide-separator" : ""}`}
            >
              {isSpamOrTrash && (
                <Button
                  name="move-to-inbox"
                  help={t("move_to_inbox")}
                  onClick={handleMoveToInbox}
                />
              )}

              {!isSpamOrTrash && !isDrafts && (
                <div className="select-all-container">
                  {hasFavoriteSelected() ? (
                    <Button
                      name="unfavorite"
                      help={t("unstarred")}
                      onClick={handleUnMarkAsFavorite}
                    />
                  ) : (
                    <Button
                      name="favorites"
                      help={t("starred")}
                      onClick={handleMarkAsFavorite}
                    />
                  )}
                  {!isSent && (
                    <Button
                      name="spam"
                      help={t("spam")}
                      onClick={handleMarkAsSpam}
                    />
                  )}
                </div>
              )}

              <Button
                name="trash"
                help={t("trash")}
                onClick={(event: any) => {
                  event.preventDefault();
                  onDelete?.()
                }}
              />
            </div>
            <div className="select-all__tools-right">
              {mainPage && !isSpamOrTrash && !isDrafts && (
                <>
                  {hasOnlyUnread ? (
                    <Button
                      name="read-all-mail"
                      help={t("mark_as_read")}
                      onClick={handleMarkAsRead}
                    />
                  ) : hasReadSelected() ? (
                    <Button
                      name="unread-all-mail"
                      help={t("mark_as_unread")}
                      onClick={handleMarkAsUnread}
                    />
                  ) : null}
                </>
              )}
              {mainPage && !isSpamOrTrash && !isDrafts && (
                <div className="move-to-folder-container">
                  <Button
                    name="move-to-folder"
                    help={t("move_to_folder")}
                    onClick={handleMoveToFolder}
                  />
                  {showFolderList && (
                    <div className="folder-dropdown">
                      {folders.length > 0 ? (
                        folders.map((folder: any) => (
                          <div
                            key={folder.id}
                            className="folder-dropdown__item"
                            onClick={(e: any) =>
                              handleFolderSelect(folder.id, e)
                            }
                          >
                            {folder.name}
                          </div>
                        ))
                      ) : (
                        <div className="folder-dropdown__item folder-dropdown__item--empty">
                          Нет доступных папок
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {!isMobile || !hasSelected ? (
        <div className="mail-header__right-container">
          <div className="count-email">
            {startItem} - {endItem} {t("of")} {total}
          </div>
          <Button
            name="left"
            help="Пред."
            block={offset === 0}
            onClick={handlePrevPage}
          />
          <Button
            name="right"
            help="След."
            block={offset + 50 >= total}
            onClick={handleNextPage}
          />
        </div>
      ) : null}
    </div>
  )
}
