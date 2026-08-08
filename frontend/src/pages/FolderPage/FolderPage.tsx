import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import {
  getFolderEmails,
  deleteEmailsFromFolder,
} from "../../api/ApiFolder";
import { useMailStore } from "../../store/useMailStore";
import { useTranslation } from "../../hooks/useTranslation";

export default function FolderPage() {
  const { t } = useTranslation();
  const { folders, currentFolderId } = useMailStore();
  const folderName =
    folders.find((f: any) => f.id === currentFolderId)?.name || t("folder");

  return (
    <BaseEmailPage
      currentView="folder"
      fetchEmails={(offset: number) =>
        getFolderEmails(offset, currentFolderId)
      }
      deleteEmails={(ids: number[]) =>
        deleteEmailsFromFolder(currentFolderId, ids)
      }
      emptyMessage="empty_folder"
      emptySubMessage="empty_folder_sub"
      showUnreadToggle={false}
      showMarkAsRead={false}
      showMoveToFolder={false}
      currentFolderId={currentFolderId}
      currentFolderName={folderName}
    />
  );
}
